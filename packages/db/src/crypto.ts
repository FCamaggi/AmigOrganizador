import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

function parseKey(keyBase64: string): Buffer {
  const key = Buffer.from(keyBase64, "base64");
  if (key.byteLength !== KEY_BYTES) {
    throw new Error(
      `Invalid encryption key length: expected ${KEY_BYTES} bytes (base64), got ${key.byteLength} bytes`,
    );
  }
  return key;
}

export function encryptUrl(plain: string, keyBase64: string): string {
  const key = parseKey(keyBase64);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_BYTES,
  });
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}.${iv.toString("base64url")}.${tag.toString("base64url")}.${ct.toString("base64url")}`;
}

export function decryptUrl(ciphertext: string, keyBase64: string): string {
  const key = parseKey(keyBase64);
  const parts = ciphertext.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Invalid ciphertext format");
  }
  const [, ivB64, tagB64, ctB64] = parts as [string, string, string, string];
  if (
    !/^[A-Za-z0-9_-]+$/.test(ivB64) ||
    !/^[A-Za-z0-9_-]+$/.test(tagB64) ||
    !/^[A-Za-z0-9_-]*$/.test(ctB64)
  ) {
    throw new Error("Invalid ciphertext encoding");
  }
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const ct = Buffer.from(ctB64, "base64url");
  if (
    iv.byteLength !== IV_BYTES ||
    tag.byteLength !== TAG_BYTES ||
    iv.toString("base64url") !== ivB64 ||
    tag.toString("base64url") !== tagB64 ||
    ct.toString("base64url") !== ctB64
  ) {
    throw new Error("Invalid ciphertext components");
  }
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_BYTES,
  });
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plain.toString("utf8");
}
