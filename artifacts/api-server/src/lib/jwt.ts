import jwt from "jsonwebtoken";

function getAccessSecret(): string {
  const value = process.env.JWT_ACCESS_SECRET;
  if (!value) {
    throw new Error("JWT_ACCESS_SECRET must be set");
  }
  return value;
}

function getRefreshSecret(): string {
  const value = process.env.JWT_REFRESH_SECRET;
  if (!value) {
    throw new Error("JWT_REFRESH_SECRET must be set");
  }
  return value;
}

export interface AccessTokenPayload {
  sub: string;
  phone: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: "refresh";
}

const ACCESS_TTL_SECONDS = Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900);
const REFRESH_TTL_SECONDS = Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 60 * 60 * 24 * 30);

export function accessTokenTtlSeconds(): number {
  return ACCESS_TTL_SECONDS;
}

export function refreshTokenTtlSeconds(): number {
  return REFRESH_TTL_SECONDS;
}

export function signAccessToken(userId: string, phone: string): string {
  const payload: AccessTokenPayload = { sub: userId, phone, type: "access" };
  return jwt.sign(payload, getAccessSecret(), { expiresIn: ACCESS_TTL_SECONDS });
}

export function signRefreshToken(userId: string, jti: string): string {
  const payload: RefreshTokenPayload = { sub: userId, jti, type: "refresh" };
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: REFRESH_TTL_SECONDS });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getAccessSecret());
  if (!decoded || typeof decoded !== "object" || !("type" in decoded) || decoded.type !== "access") {
    throw new Error("Invalid access token");
  }
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, getRefreshSecret());
  if (!decoded || typeof decoded !== "object" || !("type" in decoded) || decoded.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return decoded as RefreshTokenPayload;
}
