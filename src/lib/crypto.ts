import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getMasterKey(): Buffer {
  const key = process.env.EVALIS_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("EVALIS_ENCRYPTION_KEY is not configured");
  }

  return crypto.createHash("sha256").update(key).digest();
}

export function hashToken(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function generateToken(size = 32): string {
  return crypto.randomBytes(size).toString("hex");
}

export function encryptSecret(plainText: string): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(cipherText: string): string {
  const [ivHex, tagHex, encryptedHex] = cipherText.split(":");

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Invalid encrypted secret format");
  }

  const key = getMasterKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
