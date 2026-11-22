#!/usr/bin/env node
// Prints the current 6-digit code for a LOCAL TEST account (RFC 6238: SHA-1, 30 s, 6 digits), reading the
// secret from apps/web/.dev-accounts.local.json (gitignored). Only for the altair-dev test accounts.
// Usage: npm run dev:totp [-- owner]
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const who = process.argv[2] ?? "owner";
const accounts = JSON.parse(readFileSync(path.join(root, "apps/web/.dev-accounts.local.json"), "utf8"));
const secret = accounts[who]?.totp_secret;
if (!secret) {
  console.error(`No totp_secret for "${who}" in apps/web/.dev-accounts.local.json`);
  process.exit(1);
}

function base32(s) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of s.replace(/[\s=]/g, "").toUpperCase()) {
    const v = alphabet.indexOf(ch);
    if (v < 0) throw new Error(`Not base32: ${ch}`);
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

const counter = Math.floor(Date.now() / 1000 / 30);
const msg = Buffer.alloc(8);
msg.writeBigUInt64BE(BigInt(counter));
const h = createHmac("sha1", base32(secret)).update(msg).digest();
const o = h[h.length - 1] & 0xf;
const code = ((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
const left = 30 - (Math.floor(Date.now() / 1000) % 30);
console.log(`${code}  (válido ${left} s más)`);
