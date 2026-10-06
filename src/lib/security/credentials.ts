import "server-only";

import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getEncryptionKey() {
  const encodedKey = process.env.PAYSAFE_CREDENTIAL_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error(
      "PAYSAFE_CREDENTIAL_ENCRYPTION_KEY is not configured."
    );
  }

  const key = Buffer.from(encodedKey, "base64");

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      "PAYSAFE_CREDENTIAL_ENCRYPTION_KEY must decode to exactly 32 bytes."
    );
  }

  return key;
}

export function encryptCredential(value: string) {
  if (!value) {
    throw new Error("Credential value cannot be empty.");
  }

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptCredential(value: string) {
  const parts = value.split(":");

  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid encrypted credential format.");
  }

  const [, ivEncoded, authTagEncoded, encryptedEncoded] = parts;

  const iv = Buffer.from(ivEncoded, "base64url");
  const authTag = Buffer.from(authTagEncoded, "base64url");
  const encrypted = Buffer.from(encryptedEncoded, "base64url");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}