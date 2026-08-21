"use strict";

const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const { spawnSync } = require("child_process");
const { verifyReceipt } = require("./verify-receipt");

const DEFAULT_GATEWAY = "https://causal-engine-gateway.fly.dev";
const DEFAULT_TIMEOUT_SECONDS = 120;

function getInput(name) {
  const upper = String(name).toUpperCase();
  const underscored = upper.replace(/-/g, "_");
  for (const key of [`INPUT_${underscored}`, `INPUT_${upper}`]) {
    if (process.env[key] != null && String(process.env[key]).length > 0) {
      return String(process.env[key]).trim();
    }
  }
  return "";
}

function maskSecrets(text, apiKey) {
  let out = String(text ?? "");
  if (apiKey) {
    out = out.split(apiKey).join("cek_...");
  }
  return out.replace(/cek_[A-Za-z0-9_-]+/g, (match) => `${match.slice(0, 8)}...`);
}

function setOutput(name, value) {
  const dest = process.env.GITHUB_OUTPUT;
  if (!dest) {
    return;
  }
  const token = `EOF_${name.replace(/[^A-Za-z0-9_]/g, "_")}_${process.pid}`;
  fs.appendFileSync(dest, `${name}<<${token}\n${value ?? ""}\n${token}\n`, "utf8");
}

function fail(message, apiKey = "") {
  console.error(`::error::${maskSecrets(message, apiKey)}`);
  process.exit(1);
}

function workspaceRoot() {
  return process.env.GITHUB_WORKSPACE || process.cwd();
}

function isOutside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative.startsWith("..") || path.isAbsolute(relative);
}

function resolveWorkspaceFile(inputPath, label, apiKey) {
  const root = fs.realpathSync(workspaceRoot());
  const abs = path.resolve(root, inputPath);
  if (isOutside(root, abs)) {
    fail(`${label} must stay inside the GitHub workspace.`, apiKey);
  }
  if (!fs.existsSync(abs)) {
    fail(`${label} does not exist: ${inputPath}`, apiKey);
  }

  const real = fs.realpathSync(abs);
  if (isOutside(root, real)) {
    fail(`${label} must not resolve outside the GitHub workspace.`, apiKey);
  }
  if (!fs.statSync(real).isFile()) {
    fail(`${label} must be a regular file.`, apiKey);
  }
  return { abs: real, relative: path.relative(root, real) };
}

function findChangedPython() {
  const baseRef = (process.env.GITHUB_BASE_REF || "").trim();
  if (!baseRef) {
    return null;
  }
  const result = spawnSync(
    "git",
    ["diff", "--name-only", "--diff-filter=AM", `origin/${baseRef}`],
    { encoding: "utf8", cwd: workspaceRoot() }
  );
  if (result.status !== 0) {
    return null;
  }
  const files = String(result.stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.endsWith(".py"));
  return files[0] || null;
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: String(text || "").slice(0, 2000) };
  }
}

function normalizeResult(body, httpStatus) {
  const result = {
    httpStatus,
    passed: false,
    status: httpStatus === 402 ? "PAYMENT_REQUIRED" : "HTTP_ERROR",
    endpointId: "",
    checkoutUrl: "",
    creditsRemaining: "",
    requestId: "",
    astValid: "",
    errorType: "",
    message: "",
  };

  if (!body || typeof body !== "object") {
    return result;
  }

  result.checkoutUrl = body.checkout_url || body.checkoutUrl || "";
  result.requestId = body.request_id || body.requestId || "";
  result.creditsRemaining =
    body.credits_remaining != null ? String(body.credits_remaining) :
    body.creditsRemaining != null ? String(body.creditsRemaining) : "";

  const error = body.error && typeof body.error === "object" ? body.error : null;
  if (error) {
    result.errorType = error.type || "";
    result.message = error.message || "";
    result.requestId = result.requestId || error.request_id || "";
  }

  if (httpStatus === 402) {
    result.errorType = result.errorType || "credits_exhausted";
    return result;
  }

  if (typeof body.passed === "boolean") {
    result.passed = body.passed;
    result.status = body.status || (body.passed ? "pass" : "fail");
    return result;
  }

  const cycle = body.cycle_result && typeof body.cycle_result === "object" ? body.cycle_result : null;
  if (cycle) {
    result.status = cycle.status || result.status;
    result.passed = cycle.status === "SETTLED";
    const endpoint = cycle.endpoint || {};
    const telemetry = cycle.telemetry || {};
    result.endpointId = endpoint.endpoint_id || telemetry.content_hash || "";
    if (typeof telemetry.ast_valid === "boolean") {
      result.astValid = String(telemetry.ast_valid);
    }
  }

  if (body.workload_telemetry && typeof body.workload_telemetry.ast_valid === "boolean") {
    result.astValid = String(body.workload_telemetry.ast_valid);
  }

  return result;
}

function requireSignedReceipt() {
  const raw = getInput("require-signed-receipt").toLowerCase();
  if (!raw) return true;
  if (["true", "1", "yes"].includes(raw)) return true;
  if (["false", "0", "no"].includes(raw)) return false;
  fail("require-signed-receipt must be true or false.");
}

function timeoutSeconds() {
  const raw = getInput("timeout-seconds");
  if (!raw) {
    return DEFAULT_TIMEOUT_SECONDS;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 5 || n > 600) {
    fail("timeout-seconds must be a number from 5 to 600.");
  }
  return n;
}

function expectedTestSha256() {
  const value = getInput("expected-test-sha256");
  if (!value) {
    return "";
  }
  if (!/^[a-f0-9]{64}$/.test(value)) {
    fail("expected-test-sha256 must be exactly 64 lowercase hexadecimal characters.");
  }
  return value;
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(Buffer.from(value, "utf8")).digest("hex");
}

async function main() {
  const apiKey = getInput("api-key");
  if (apiKey) {
    console.log(`::add-mask::${apiKey}`);
  }
  if (!apiKey) {
    fail("Missing input api-key. Register with POST /v1/accounts/signup and store the cek_ key as a GitHub secret.");
  }

  const gateway = (getInput("gateway-url") || DEFAULT_GATEWAY).replace(/\/+$/, "");
  let gatewayUrl;
  try {
    gatewayUrl = new URL(gateway);
  } catch {
    fail("gateway-url must be a valid http or https URL.", apiKey);
  }
  if (!["http:", "https:"].includes(gatewayUrl.protocol) || gatewayUrl.username || gatewayUrl.password) {
    fail("gateway-url must be an http or https URL without embedded credentials.", apiKey);
  }

  let sourcePath = getInput("source-path");
  const testPath = getInput("test-path");

  if (!sourcePath) {
    sourcePath = findChangedPython() || "";
  }
  if (!sourcePath) {
    fail("Missing source-path and no changed .py files were found vs origin/<base_ref>.", apiKey);
  }

  if (!testPath) {
    fail("Missing required input test-path. Provide a pytest contract for meaningful verification.", apiKey);
  }

  const source = resolveWorkspaceFile(sourcePath, "source-path", apiKey);
  const test = resolveWorkspaceFile(testPath, "test-path", apiKey);
  const sourceCode = fs.readFileSync(source.abs, "utf8");
  const testCode = fs.readFileSync(test.abs, "utf8");
  const targetName = path.basename(source.relative);

  const approvedTestDigest = expectedTestSha256();
  const submittedTestDigest = sha256Text(testCode);
  if (approvedTestDigest && submittedTestDigest !== approvedTestDigest) {
    fail(
      `The pytest contract does not match the approved expected-test-sha256 (${approvedTestDigest}).`,
      apiKey
    );
  }

  const url = `${gateway}/v1/verify`;
  console.log(`Causal Verify: POST ${url} target=${targetName}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSeconds() * 1000);
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Causal-Engine-Key": apiKey,
      },
      body: JSON.stringify({
        source: sourceCode,
        tests: testCode,
        target_path: targetName,
        source_code: sourceCode,
        test_code: testCode,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    fail(`Request to /v1/verify failed: ${err && err.message ? err.message : err}`, apiKey);
  } finally {
    clearTimeout(timer);
  }

  const rawText = await response.text();
  const body = parseJsonSafe(rawText);
  const result = normalizeResult(body, response.status);

  setOutput("http-status", String(result.httpStatus));
  setOutput("cycle-status", result.status);
  setOutput("status", result.status);
  setOutput("passed", String(result.passed));
  setOutput("endpoint-id", result.endpointId);
  setOutput("checkout-url", result.checkoutUrl);
  setOutput("credits-remaining", result.creditsRemaining);
  setOutput("request-id", result.requestId);
  setOutput("ast-valid", result.astValid);
  setOutput("error-type", result.errorType);

  if (result.httpStatus === 402) {
    console.log("HTTP 402 PAYMENT_REQUIRED - merge is blocked until this account has verification credits.");
    if (result.checkoutUrl) {
      console.log(`checkout_url: ${result.checkoutUrl}`);
    }
    process.exit(1);
  }

  if (result.httpStatus < 200 || result.httpStatus >= 300) {
    fail(`Engine returned HTTP ${result.httpStatus} for ${source.relative}. ${result.errorType || ""} ${result.message || ""}`, apiKey);
  }

  if (requireSignedReceipt()) {
    if (!["pass", "fail", "SETTLED", "FAILED"].includes(result.status)) {
      fail(`Engine returned an unsupported signed decision status: ${result.status}`, apiKey);
    }
    const statusPassed = ["pass", "SETTLED"].includes(result.status);
    if (statusPassed !== result.passed) {
      fail(
        `Engine response contradiction: status ${result.status} disagrees with passed=${result.passed}.`,
        apiKey
      );
    }

    const keyController = new AbortController();
    const keyTimer = setTimeout(() => keyController.abort(), timeoutSeconds() * 1000);
    let keyResponse;
    try {
      keyResponse = await fetch(`${gateway}/.well-known/causal-verification-keys.json`, {
        headers: { Accept: "application/json" },
        signal: keyController.signal,
      });
    } catch (err) {
      fail(`Could not retrieve the receipt verification keyset: ${err && err.message ? err.message : err}`, apiKey);
    } finally {
      clearTimeout(keyTimer);
    }
    if (!keyResponse.ok) fail(`Receipt keyset returned HTTP ${keyResponse.status}.`, apiKey);
    const keyset = await keyResponse.json();
    const verification = verifyReceipt(body, keyset, { source: sourceCode, tests: testCode });
    if (!verification.valid) fail(`Signed receipt verification failed: ${verification.classification} ${verification.reason}`, apiKey);

    const expectedSignedResult = result.passed ? "PASSED" : "FAILED";
    if (verification.result !== expectedSignedResult) {
      fail(
        `Signed receipt verdict mismatch: API reported ${expectedSignedResult}, receipt signed ${verification.result}.`,
        apiKey
      );
    }

    const receiptId = String(body.receipt_id || "");
    if (!/^[a-f0-9]{64}$/.test(receiptId)) {
      fail("Signed response must include a 64-character lowercase hexadecimal receipt_id.", apiKey);
    }
    const signedReceiptUrl = verification.statement.predicate.url || "";
    setOutput("receipt-id", receiptId);
    setOutput("receipt-url", signedReceiptUrl);
    setOutput("receipt-authentication", "DSSE_ED25519");
    console.log(`Signed receipt: VALID (${verification.keyid})`);
  }

  console.log(`${result.passed ? "PASS" : "FAIL"} for ${source.relative}`);
  console.log(`status: ${result.status}`);
  if (result.endpointId) {
    console.log(`endpoint_id: ${result.endpointId}`);
  }
  if (result.creditsRemaining) {
    console.log(`credits_remaining: ${result.creditsRemaining}`);
  }
  if (result.requestId) {
    console.log(`request_id: ${result.requestId}`);
  }

  if (!result.passed) {
    process.exit(1);
  }
}

main().catch((err) => {
  fail(err && err.stack ? err.stack : String(err));
});
