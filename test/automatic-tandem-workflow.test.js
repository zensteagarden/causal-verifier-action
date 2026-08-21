"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const workflowPath = path.join(
  __dirname,
  "..",
  ".github",
  "workflows",
  "noticer-tandem-proof.yml"
);

test("the tandem proof runs automatically and fails closed", () => {
  const workflow = fs.readFileSync(workflowPath, "utf8");

  assert.match(workflow, /^\s{2}pull_request:\s*$/m);
  assert.match(workflow, /^\s{2}workflow_dispatch:\s*$/m);
  assert.doesNotMatch(workflow, /pull_request_target/);
  assert.match(workflow, /CAUSAL_ENGINE_API_KEY is unavailable/);
  assert.match(workflow, /NOTICER_CONTRACT_SHA256 must contain the approved contract digest/);
  assert.match(workflow, /expected-test-sha256: \$\{\{ vars\.NOTICER_CONTRACT_SHA256 \}\}/);
  assert.match(workflow, /zensteagarden\/causal-verifier-action@[a-f0-9]{40}/);
  assert.match(workflow, /actions\/checkout@[a-f0-9]{40}/);
  assert.match(workflow, /actions\/setup-python@[a-f0-9]{40}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /require-signed-receipt: "true"/);
  assert.match(workflow, /source-path: demo\/tandem-proof\/order_service\.py/);
  assert.match(workflow, /test-path: demo\/tandem-proof\/test_outcome_contract\.py/);
  assert.doesNotMatch(workflow, /^\s+(?:echo|printf).*\$\{\{ steps\.noticer\.outputs\./m);
});
