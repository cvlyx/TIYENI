import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema/users";
import { walletsTable } from "@workspace/db/schema/payments";
import { otpCodesTable, refreshTokensTable } from "@workspace/db/schema/auth";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { genId, genOtp } from "../lib/id";
import { z } from "zod";
import {
  accessTokenTtlSeconds,
  refreshTokenTtlSeconds,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { hashValue, sendOtp } from "../lib/otp";
import { requireAuth, getUser } from "../middlewares/auth";

const router = Router();

// ─── Schemas ────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  identifier: z.string().min(1), // email or username
  password: z.string().min(1),
});

const VerifyOtpSchema = z.object({
  phone: z.string().min(8),
  otp: z.string().length(6),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(20),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function issueTokens(userId: string, phone: string) {
  const jti = genId("rt");
  const accessToken = signAccessToken(userId, phone);
  const refreshToken = signRefreshToken(userId, jti);
  const refreshExpiresAt = new Date(Date.now() + refreshTokenTtlSeconds() * 1000);
  await db.insert(refreshTokensTable).values({
    jti, userId, tokenHash: hashValue(refreshToken), expiresAt: refreshExpiresAt,
  });
  return { accessToken, refreshToken, expiresIn: accessTokenTtlSeconds() };
}

async function sendOtpToUser(phone: string, email?: string | null): Promise<string> {
  const otp = genOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await db.insert(otpCodesTable).values({
    id: genId("otp"), phone, codeHash: hashValue(otp), expiresAt,
  });
  // Send via Africa's Talking SMS
  try { await sendOtp(phone, otp); } catch { /* fallback to console */ }
  // TODO: also send to email when email provider is configured
  console.log(`[OTP] ${phone} -> ${otp}`);
  return otp;
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post("/auth/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { name, username, email, phone, password } = parsed.data;

  // Check uniqueness
  const existing = await db.select({ id: usersTable.id, field: usersTable.phone })
    .from(usersTable)
    .where(or(eq(usersTable.phone, phone), eq(usersTable.email, email), eq(usersTable.username, username)))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Phone, email or username already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = genId("u");

  await db.insert(usersTable).values({
    id, name, username, email, phone, passwordHash,
    phoneVerified: false, emailVerified: false,
  });
  await db.insert(walletsTable).values({ id: genId("w"), userId: id, balance: 0 });

  // Send OTP to phone (and email in future)
  const otp = await sendOtpToUser(phone, email);

  res.status(201).json({
    success: true,
    message: "Account created. Please verify your phone with the OTP sent.",
    phone,
    ...(process.env.NODE_ENV !== "production" ? { devCode: otp } : {}),
  });
});

// ─── POST /api/auth/verify-phone ─────────────────────────────────────────────
router.post("/auth/verify-phone", async (req, res) => {
  const parsed = VerifyOtpSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const { phone, otp } = parsed.data;

  const [otpRecord] = await db.select().from(otpCodesTable)
    .where(and(eq(otpCodesTable.phone, phone), isNull(otpCodesTable.consumedAt), gt(otpCodesTable.expiresAt, new Date())))
    .orderBy(desc(otpCodesTable.createdAt))
    .limit(1);

  if (!otpRecord) { res.status(400).json({ error: "OTP expired or not found" }); return; }

  if (otpRecord.codeHash !== hashValue(otp)) {
    await db.update(otpCodesTable).set({ attempts: otpRecord.attempts + 1 }).where(eq(otpCodesTable.id, otpRecord.id));
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }

  await db.update(otpCodesTable).set({ consumedAt: new Date() }).where(eq(otpCodesTable.id, otpRecord.id));
  await db.update(usersTable).set({ phoneVerified: true }).where(eq(usersTable.phone, phone));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const tokens = await issueTokens(user.id, user.phone);
  res.json({ user, token: tokens.accessToken, ...tokens });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const { identifier, password } = parsed.data;

  // Find by email or username
  const [user] = await db.select().from(usersTable)
    .where(or(eq(usersTable.email, identifier), eq(usersTable.username, identifier)))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Invalid credentials" }); return; }

  if (!user.phoneVerified) {
    // Resend OTP if not verified
    const otp = await sendOtpToUser(user.phone, user.email);
    res.status(403).json({
      error: "Phone not verified",
      phone: user.phone,
      ...(process.env.NODE_ENV !== "production" ? { devCode: otp } : {}),
    });
    return;
  }

  const tokens = await issueTokens(user.id, user.phone);
  res.json({ user, token: tokens.accessToken, ...tokens });
});

// ─── POST /api/auth/resend-otp ────────────────────────────────────────────────
router.post("/auth/resend-otp", async (req, res) => {
  const parsed = z.object({ phone: z.string().min(8) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, parsed.data.phone)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const otp = await sendOtpToUser(user.phone, user.email);
  res.json({
    success: true,
    ...(process.env.NODE_ENV !== "production" ? { devCode: otp } : {}),
  });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post("/auth/refresh", async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const token = parsed.data.refreshToken;
  let payload: { sub: string; jti: string };
  try { payload = verifyRefreshToken(token); }
  catch { res.status(401).json({ error: "Invalid refresh token" }); return; }

  const [stored] = await db.select().from(refreshTokensTable).where(eq(refreshTokensTable.jti, payload.jti)).limit(1);
  if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
    res.status(401).json({ error: "Refresh token revoked or expired" }); return;
  }
  if (stored.tokenHash !== hashValue(token)) {
    res.status(401).json({ error: "Refresh token mismatch" }); return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub)).limit(1);
  if (!user) { res.status(401).json({ error: "User not found" }); return; }

  await db.update(refreshTokensTable).set({ revokedAt: new Date() }).where(eq(refreshTokensTable.jti, payload.jti));
  const tokens = await issueTokens(user.id, user.phone);
  res.json(tokens);
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post("/auth/logout", async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    await db.update(refreshTokensTable).set({ revokedAt: new Date() }).where(eq(refreshTokensTable.jti, payload.jti));
  } catch { /* idempotent */ }
  res.json({ success: true });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req, res) => {
  const user = getUser(req);
  const [full] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
  res.json({ user: full });
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
router.get("/users/:id", async (req, res) => {
  const [user] = await db.select({
    id: usersTable.id, name: usersTable.name, username: usersTable.username,
    rating: usersTable.rating, role: usersTable.role,
    tripsCompleted: usersTable.tripsCompleted, avatarUrl: usersTable.avatarUrl,
    verificationStatus: usersTable.verificationStatus, createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, String(req.params.id))).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ user: { ...user, isVerified: user.role === "verified" } });
});

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────
router.patch("/users/me", requireAuth, async (req, res) => {
  const user = getUser(req);
  const parsed = z.object({
    name: z.string().min(1).optional(),
    avatarUrl: z.string().url().optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  if (Object.keys(parsed.data).length > 0) {
    await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, user.id));
  }
  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
  res.json({ user: updated });
});

// ─── POST /api/auth/verify-identity ──────────────────────────────────────────
// Submit ID verification documents (URLs from client-side upload)
router.post("/auth/verify-identity", requireAuth, async (req, res) => {
  const user = getUser(req);
  const parsed = z.object({
    idDocumentUrl: z.string().url(),
    selfieUrl: z.string().url(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  await db.update(usersTable).set({
    idDocumentUrl: parsed.data.idDocumentUrl,
    selfieUrl: parsed.data.selfieUrl,
    verificationStatus: "pending",
  }).where(eq(usersTable.id, user.id));
  res.json({ success: true, message: "Verification submitted for review" });
});

export default router;
