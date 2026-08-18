"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { pae, verifyReceipt } = require("../verify-receipt");

function fixture() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const source = "def add(a, b):\n    return a + b\n";
  const tests = "def test_add():\n    assert add(2, 3) == 5\n";
  const statement = {
    _type: "https://in-toto.io/Statement/v1",
    subject: [{ name: "solution.py", digest: { sha256: crypto.createHash("sha256").update(source).digest("hex") } }],
    predicateType: "https://in-toto.io/attestation/test-result/v0.1",
    predicate: {
      result: "PASSED",
      configuration: [{ name: "submitted-tests", digest: { sha256: crypto.createHash("sha256").update(tests).digest("hex") } }],
    },
  };
  const payload = Buffer.from(JSON.stringify(statement));
  const payloadType = "application/vnd.in-toto+json";
  const jwk = publicKey.export({ format: "jwk" });
  const keyid = crypto.createHash("sha256").update(Buffer.from(jwk.x, "base64url")).digest("hex");
  const envelope = {
    payloadType,
    payload: payload.toString("base64url"),
    signatures: [{ keyid, sig: crypto.sign(null, pae(payloadType, payload), privateKey).toString("base64url") }],
  };
  return { source, tests, envelope, keyset: { keys: [{ keyid, kty: "OKP", crv: "Ed25519", x: jwk.x, status: "active" }] } };
}

test("validates a signed receipt and optional submitted files", () => {
  const f = fixture();
  const result = verifyReceipt(f.envelope, f.keyset, { source: f.source, tests: f.tests });
  assert.equal(result.classification, "VALID");
  assert.equal(result.result, "PASSED");
});

test("rejects payload tampering", () => {
  const f = fixture();
  const payload = JSON.parse(Buffer.from(f.envelope.payload, "base64url").toString());
  payload.predicate.result = "FAILED";
  f.envelope.payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  assert.equal(verifyReceipt(f.envelope, f.keyset).classification, "INVALID");
});

test("rejects wrong source and tests", () => {
  const f = fixture();
  assert.match(verifyReceipt(f.envelope, f.keyset, { source: "wrong" }).reason, /source digest/);
  assert.match(verifyReceipt(f.envelope, f.keyset, { tests: "wrong" }).reason, /test digest/);
});

test("rejects unknown and revoked keys", () => {
  const f = fixture();
  assert.equal(verifyReceipt(f.envelope, { keys: [] }).classification, "UNTRUSTED");
  f.keyset.keys[0].status = "revoked";
  assert.equal(verifyReceipt(f.envelope, f.keyset).classification, "UNTRUSTED");
});

test("rejects malformed envelopes", () => {
  assert.equal(verifyReceipt({}, { keys: [] }).classification, "INVALID");
});
