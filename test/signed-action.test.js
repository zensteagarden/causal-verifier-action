"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const test = require("node:test");
const { pae } = require("../verify-receipt");

const actionPath = path.resolve(__dirname, "..", "index.js");

function runAction(workspace, gateway, key) {
  const output = path.join(workspace, key + ".out");
  const env = {
    ...process.env,
    GITHUB_WORKSPACE: workspace,
    GITHUB_OUTPUT: output,
    INPUT_API_KEY: key,
    INPUT_GATEWAY_URL: gateway,
    INPUT_SOURCE_PATH: "solution.py",
    INPUT_TEST_PATH: "test_solution.py",
    INPUT_TIMEOUT_SECONDS: "5",
    INPUT_REQUIRE_SIGNED_RECEIPT: "true",
  };
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [actionPath], { env });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => resolve({ code, stdout, stderr, outputs: fs.existsSync(output) ? fs.readFileSync(output, "utf8") : "" }));
  });
}

test("action requires a valid signed receipt bound to submitted files", async (t) => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const jwk = publicKey.export({ format: "jwk" });
  const keyid = crypto.createHash("sha256").update(Buffer.from(jwk.x, "base64url")).digest("hex");
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "causal-signed-action-"));
  const source = "def add(a, b):\n    return a + b\n";
  const tests = "def test_add():\n    assert add(2, 3) == 5\n";
  fs.writeFileSync(path.join(workspace, "solution.py"), source);
  fs.writeFileSync(path.join(workspace, "test_solution.py"), tests);

  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.method === "GET") {
      res.end(JSON.stringify({ keys: [{ kid: keyid, kty: "OKP", crv: "Ed25519", x: jwk.x, status: "active" }] }));
      return;
    }
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      const body = JSON.parse(raw);
      const authorization = req.headers.authorization || "";
      if (authorization.includes("unsigned")) {
        res.end(JSON.stringify({ status: "pass", passed: true }));
        return;
      }
      const outerFailed = authorization.includes("outer-failed");
      const contradictoryStatus = authorization.includes("status-failed");
      const signedFailed = authorization.includes("signed-failed");
      const badReceiptId = authorization.includes("bad-receipt-id");
      const receipt = {
        _type: "https://in-toto.io/Statement/v1",
        subject: [{ name: body.target_path, digest: { sha256: crypto.createHash("sha256").update(body.source_code).digest("hex") } }],
        predicateType: "https://in-toto.io/attestation/test-result/v0.1",
        predicate: {
          result: signedFailed ? "FAILED" : "PASSED",
          configuration: [{ name: "submitted-tests", digest: { sha256: crypto.createHash("sha256").update(body.test_code).digest("hex") } }],
          url: "https://example.test/v1/receipts/" + "a".repeat(64),
        },
      };
      const payload = Buffer.from(JSON.stringify(receipt));
      const payloadType = "application/vnd.in-toto+json";
      const receipt_envelope = {
        payloadType,
        payload: payload.toString("base64url"),
        signatures: [{ keyid, sig: crypto.sign(null, pae(payloadType, payload), privateKey).toString("base64url") }],
      };
      res.end(JSON.stringify({
        status: outerFailed || contradictoryStatus ? "fail" : "pass",
        passed: !outerFailed,
        receipt_id: badReceiptId ? "$(untrusted)" : "a".repeat(64),
        receipt_authentication: "DSSE_ED25519",
        receipt,
        receipt_envelope,
      }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const gateway = `http://127.0.0.1:${server.address().port}`;

  const valid = await runAction(workspace, gateway, "cek_signed");
  assert.equal(valid.code, 0);
  assert.match(valid.stdout, /Signed receipt: VALID/);
  assert.match(valid.outputs, /receipt-id<<[^\n]+\n[a]{64}\n/);

  const unsigned = await runAction(workspace, gateway, "cek_unsigned");
  assert.equal(unsigned.code, 1);
  assert.match(unsigned.stderr, /Signed receipt verification failed/);

  const signedFailedAgainstOuterPass = await runAction(workspace, gateway, "cek_signed-failed");
  assert.equal(signedFailedAgainstOuterPass.code, 1);
  assert.match(signedFailedAgainstOuterPass.stderr, /Signed receipt verdict mismatch/);

  const signedPassAgainstOuterFailure = await runAction(workspace, gateway, "cek_outer-failed");
  assert.equal(signedPassAgainstOuterFailure.code, 1);
  assert.match(signedPassAgainstOuterFailure.stderr, /Signed receipt verdict mismatch/);

  const invalidReceiptId = await runAction(workspace, gateway, "cek_bad-receipt-id");
  assert.equal(invalidReceiptId.code, 1);
  assert.match(invalidReceiptId.stderr, /lowercase hexadecimal receipt_id/);

  const contradictoryOuterFields = await runAction(workspace, gateway, "cek_status-failed");
  assert.equal(contradictoryOuterFields.code, 1);
  assert.match(contradictoryOuterFields.stderr, /Engine response contradiction/);
});
