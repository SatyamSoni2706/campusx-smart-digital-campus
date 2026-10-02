import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${key}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [salt, storedHex] = encoded.split(":");
  if (!salt || !storedHex || !/^[0-9a-f]{128}$/i.test(storedHex)) return false;
  const stored = Buffer.from(storedHex, "hex");
  const actual = scryptSync(password, salt, KEY_LENGTH);
  return stored.length === actual.length && timingSafeEqual(stored, actual);
}
