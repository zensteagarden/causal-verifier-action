"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const test = require("node:test");

const actionPath = path.resolve(__dirname, "..", "index.js");

function startServer() {
  const requests = [];
  const server = http.createServer((req, res) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      const auth = req.headers.authorization || "";
      requests.push({ auth, body: JSON.parse(raw) });
      res.setHeader("Content-Type", "application/json");

      if (auth.includes("legacy")) {
        res.end(JSON.stringify({ cycle_result: { status: "SETTLED" } }));
      } else if (auth.includes("failed")) {
        res.end(JSON.stringify({ status: "fail", passed: false }));
      } else if (auth.includes("empty")) {
        res.statusCode = 402;
        res.end(JSON.stringify({
          error: { type: "credits_exhausted" },
          checkout_url: "https://billing.example.test/checkout"
        }));
      } else if (auth.includes("echo")) {
        res.statusCode = 500;
        res.end(JSON.stringify({
          error: { type: "upstream_error", message: auth.replace("Bearer ", "") }
        }));
      } else {
        res.end(JSON.stringify({
          status: "pass",
          passed: true,
          credits_remaining: 19,
          request_id: "req_fixture"
        }));
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({
        server,
        requests,
        gateway: `http://127.0.0.1:${server.address().port}`
      });
    });
  });
}

function invoke(workspace, gateway, apiKey, overrides = {}) {
  const output = path.join(workspace, "outputs.txt");
  const env = {
    ...process.env,
    GITHUB_WORKSPACE: workspace,
    GITHUB_OUTPUT: output,
    INPUT_API_KEY: apiKey,
    INPUT_GATEWAY_URL: gateway,
    INPUT_SOURCE_PATH: "solution.py",
    INPUT_TEST_PATH: "test_solution.py",
    INPUT_TIMEOUT_SECONDS: "5",
    ...overrides,
  };

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [actionPath], { env });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => {
      resolve({
        code,
        stdout,
        stderr,
        outputs: fs.existsSync(output) ? fs.readFileSync(output, "utf8") : "",
      });
    });
  });
}

function fixture() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "causal-action-"));
  fs.writeFileSync(path.join(workspace, "solution.py"), "def add(a, b):\n    return a + b\n");
  fs.writeFileSync(
    path.join(workspace, "test_solution.py"),
    "from solution import add\n\ndef test_add():\n    assert add(2, 3) == 5\n"
  );
  return workspace;
}

test("MVP pass submits source and tests without logging them", async (t) => {
  const mock = await startServer();
  t.after(() => mock.server.close());
  const workspace = fixture();
  const result = await invoke(workspace, mock.gateway, "cek_fixture_pass");

  assert.equal(result.code, 0);
  assert.match(result.outputs, /passed<<[^\n]+\ntrue\n/);
  assert.match(result.outputs, /credits-remaining<<[^\n]+\n19\n/);
  assert.equal(mock.requests.length, 1);
  assert.equal(mock.requests[0].body.source_code, mock.requests[0].body.source);
  assert.equal(mock.requests[0].body.test_code, mock.requests[0].body.tests);
  assert.doesNotMatch(result.stdout + result.stderr, /def add|test_add/);
});

test("MVP failure blocks the job", async (t) => {
  const mock = await startServer();
  t.after(() => mock.server.close());
  const result = await invoke(fixture(), mock.gateway, "cek_fixture_failed");
  assert.equal(result.code, 1);
  assert.match(result.outputs, /status<<[^\n]+\nfail\n/);
});

test("legacy SETTLED response passes", async (t) => {
  const mock = await startServer();
  t.after(() => mock.server.close());
  const result = await invoke(fixture(), mock.gateway, "cek_fixture_legacy");
  assert.equal(result.code, 0);
  assert.match(result.outputs, /status<<[^\n]+\nSETTLED\n/);
});

test("HTTP 402 blocks and exposes billing output", async (t) => {
  const mock = await startServer();
  t.after(() => mock.server.close());
  const result = await invoke(fixture(), mock.gateway, "cek_fixture_empty");
  assert.equal(result.code, 1);
  assert.match(result.outputs, /PAYMENT_REQUIRED/);
  assert.match(result.outputs, /credits_exhausted/);
  assert.match(result.outputs, /billing\.example\.test/);
});

test("direct path escape is rejected before any request", async (t) => {
  const mock = await startServer();
  t.after(() => mock.server.close());
  const workspace = fixture();
  const outside = path.join(workspace, "..", "outside.py");
  fs.writeFileSync(outside, "SECRET = 'outside'\n");
  const result = await invoke(workspace, mock.gateway, "cek_fixture_path", {
    INPUT_SOURCE_PATH: "../outside.py"
  });

  assert.equal(result.code, 1);
  assert.equal(mock.requests.length, 0);
  assert.match(result.stderr, /must stay inside/);
});

test("symlink path escape is rejected before any request", async (t) => {
  const mock = await startServer();
  t.after(() => mock.server.close());
  const workspace = fixture();
  const outside = path.join(workspace, "..", "outside-symlink.py");
  fs.writeFileSync(outside, "SECRET = 'outside'\n");
  fs.symlinkSync(outside, path.join(workspace, "linked.py"));
  const result = await invoke(workspace, mock.gateway, "cek_fixture_symlink", {
    INPUT_SOURCE_PATH: "linked.py"
  });

  assert.equal(result.code, 1);
  assert.equal(mock.requests.length, 0);
  assert.match(result.stderr, /must not resolve outside/);
});

test("API key echoed by an error response is masked", async (t) => {
  const mock = await startServer();
  t.after(() => mock.server.close());
  const secret = "cek_fixture_echo_super_secret";
  const result = await invoke(fixture(), mock.gateway, secret);

  assert.equal(result.code, 1);
  const visibleOutput = (result.stdout + result.stderr)
    .split(/\r?\n/)
    .filter((line) => !line.startsWith("::add-mask::"))
    .join("\n");
  assert.doesNotMatch(visibleOutput, new RegExp(secret));
  assert.match(result.stderr, /cek_\.\.\./);
});

test("gateway credentials are rejected before any request", async () => {
  const result = await invoke(
    fixture(),
    "http://user:password@127.0.0.1:9",
    "cek_fixture_gateway"
  );
  assert.equal(result.code, 1);
  assert.match(result.stderr, /without embedded credentials/);
});

test("missing test-path is rejected before any request", async (t) => {
  const mock = await startServer();
  t.after(() => mock.server.close());
  const result = await invoke(fixture(), mock.gateway, "cek_fixture_no_tests", {
    INPUT_TEST_PATH: ""
  });

  assert.equal(result.code, 1);
  assert.equal(mock.requests.length, 0);
  assert.match(result.stderr, /Missing required input test-path/);
});
