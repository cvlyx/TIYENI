import { randomBytes } from "node:crypto";

export function genId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${randomBytes(4).toString("hex")}`;
}

export function genOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
