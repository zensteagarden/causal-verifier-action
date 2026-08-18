#!/usr/bin/env node
"use strict";

const fs = require("fs");
const crypto = require("crypto");

function b64urlDecode(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) {
    throw new Error("invalid base64 or base64url");
  }
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
}

function pae(payloadType, payload) {
  const type = Buffer.from(payloadType, "utf8");
  return Buffer.concat([
    Buffer.from(`DSSEv1 ${type.length} `, "ascii"), type,
    Buffer.from(` ${payload.length} `, "ascii"), payload,
  ]);
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function envelopeFrom(document) {
  return document && document.receipt_envelope ? document.receipt_envelope : document;
}

function verifyReceipt(document, keyset, options = {}) {
  try {
    const envelope = envelopeFrom(document);
    if (!envelope || envelope.payloadType !== "application/vnd.in-toto+json") {
      return { valid: false, classification: "INVALID", reason: "unsupported payload type" };
    }
    if (!Array.isArray(envelope.signatures) || envelope.signatures.length !== 1) {
      return { valid: false, classification: "INVALID", reason: "exactly one signature is required" };
    }
    const signature = envelope.signatures[0];
    const key = (keyset.keys || []).find((candidate) => (candidate.keyid || candidate.kid) === signature.keyid);
    if (!key) return { valid: false, classification: "UNTRUSTED", reason: "signing key not published" };
    if (key.status === "revoked") return { valid: false, classification: "UNTRUSTED", reason: "signing key revoked" };
    if (key.kty !== "OKP" || key.crv !== "Ed25519" || !key.x) {
      return { valid: false, classification: "UNTRUSTED", reason: "unsupported signing key" };
    }

    const payload = b64urlDecode(envelope.payload);
    const publicKey = crypto.createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: key.x }, format: "jwk" });
    if (!crypto.verify(null, pae(envelope.payloadType, payload), publicKey, b64urlDecode(signature.sig))) {
      return { valid: false, classification: "INVALID", reason: "signature mismatch" };
    }

    const statement = JSON.parse(payload.toString("utf8"));
    if (statement._type !== "https://in-toto.io/Statement/v1" ||
        statement.predicateType !== "https://in-toto.io/attestation/test-result/v0.1" ||
        !["PASSED", "FAILED"].includes(statement.predicate && statement.predicate.result)) {
      return { valid: false, classification: "INVALID", reason: "unsupported statement" };
    }

    if (options.source != null) {
      const actual = sha256(Buffer.from(options.source, "utf8"));
      const expected = statement.subject && statement.subject[0] && statement.subject[0].digest && statement.subject[0].digest.sha256;
      if (actual !== expected) return { valid: false, classification: "INVALID", reason: "source digest mismatch" };
    }
    if (options.tests != null) {
      const config = statement.predicate.configuration || [];
      const expected = config[0] && config[0].digest && config[0].digest.sha256;
      if (sha256(Buffer.from(options.tests, "utf8")) !== expected) {
        return { valid: false, classification: "INVALID", reason: "test digest mismatch" };
      }
    }

    return { valid: true, classification: "VALID", keyid: signature.keyid, result: statement.predicate.result, statement };
  } catch (error) {
    return { valid: false, classification: "INVALID", reason: error.message };
  }
}

async function loadJson(location) {
  if (/^https:\/\//.test(location)) {
    const response = await fetch(location);
    if (!response.ok) throw new Error(`keyset request returned HTTP ${response.status}`);
    return response.json();
  }
  return JSON.parse(fs.readFileSync(location, "utf8"));
}

async function cli(argv) {
  const args = Object.fromEntries(argv.slice(2).map((value, index, all) => value.startsWith("--") ? [value.slice(2), all[index + 1]] : null).filter(Boolean));
  if (!args.receipt) throw new Error("usage: node verify-receipt.js --receipt FILE [--keys FILE_OR_HTTPS_URL] [--source FILE] [--tests FILE]");
  const document = await loadJson(args.receipt);
  const keys = await loadJson(args.keys || "https://causal-engine-gateway.fly.dev/.well-known/causal-verification-keys.json");
  const result = verifyReceipt(document, keys, {
    source: args.source ? fs.readFileSync(args.source, "utf8") : undefined,
    tests: args.tests ? fs.readFileSync(args.tests, "utf8") : undefined,
  });
  console.log(`${result.classification}: ${result.valid ? result.result : result.reason}`);
  if (!result.valid) process.exitCode = 1;
}

if (require.main === module) cli(process.argv).catch((error) => { console.error(`INVALID: ${error.message}`); process.exitCode = 1; });
module.exports = { pae, verifyReceipt };
