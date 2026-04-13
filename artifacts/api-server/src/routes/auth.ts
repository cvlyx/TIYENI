import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema/users";
import { walletsTable } from "@workspace/db/schema/payments";
import { otpCodesTable, refreshTokensTable } from "@workspace/db/schema/auth";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { genId, genOtp } from "../lib/id";
import { z } from "zod";
import {
  accessTokenTtlSeconds,
  refreshTokenTtlSeconds,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { hashValue, sendOtp, verifyOtpWithTwilio } from "../lib/otp";
import { requireAuth, getUser } from "../middlewares/auth";

const router = Router();

const LoginSchema = z.object({
  phone: z.string().min(8),
  name: z.string().min(1),
});

const RequestOtpSchema = z.object({
  phone: z.string().min(8),
  name: z.string().min(1).optional(),
});

const VerifyOtpSchema = z.object({
  phone: z.string().min(8),
  otp: z.string().length(4).or(z.string().length(6)),
  name: z.string().min(1).optional(),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(20),
});

async function findOrCreateUser(phone: string, name: string) {
  let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (!user) {
    const id = genId("u");
    await db.insert(usersTable).values({ id, name, phone });
    await db.insert(walletsTable).values({ id: genId("w"), userId: id, balance: 0 });
    [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  }
  return user;
}

async function issueTokens(userId: string, phone: string) {
  const jti = genId("rt");
  const accessToken = signAccessToken(userId, phone);
  const refreshToken = signRefreshToken(userId, jti);
  const refreshExpiresAt = new Date(Date.now() + refreshTokenTtlSeconds() * 1000);

  await db.insert(refreshTokensTable).values({
    jti,
    userId,
    tokenHash: hashValue(refreshToken),
    expiresAt: refreshExpiresAt,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: accessTokenTtlSeconds(),
  };
}

// Backward-compatible auth endpoint for existing mobile flow.
router.post("/auth/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { phone, name } = parsed.data;
  const user = await findOrCreateUser(phone, name);
  const tokens = await issueTokens(user.id, user.phone);
  res.json({ user, token: tokens.accessToken, ...tokens });
});

// OTP-ready: request an OTP code for phone login.
router.post("/auth/request-otp", async (req, res) => {
  const parsed = RequestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const phone = parsed.data.phone.trim();

  // Optional name when first-time login creates a user shell.
  if (parsed.data.name) {
    await findOrCreateUser(phone, parsed.data.name);
  }

  const useTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);

  // Always generate a local OTP as fallback
  const otp = genOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.insert(otpCodesTable).values({
    id: genId("otp"),
    phone,
    codeHash: hashValue(otp),
    expiresAt,
  });

  if (useTwilio) {
    try {
      await sendOtp(phone, otp);
    } catch {
      // Twilio failed — local OTP still works
    }
    // Always log locally so dev can test without SMS delivery
    console.log(`[OTP] code for ${phone} -> ${otp}`);
  } else {
    console.log(`[OTP][DEV] ${phone} -> ${otp}`);
  }

  res.json({
    success: true,
    expiresIn: 300,
    // Only expose code in non-production for dev testing
    ...(process.env.NODE_ENV !== "production" ? { devCode: otp } : {}),
  });
});

// OTP-ready: verify OTP and issue JWT access/refresh tokens.
router.post("/auth/verify-otp", async (req, res) => {
  const parsed = VerifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const phone = parsed.data.phone.trim();
  const useTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);

  // Always check local DB first (covers both dev and Twilio-trial fallback)
  const [otpRecord] = await db
    .select()
    .from(otpCodesTable)
    .where(and(eq(otpCodesTable.phone, phone), isNull(otpCodesTable.consumedAt), gt(otpCodesTable.expiresAt, new Date())))
    .orderBy(desc(otpCodesTable.createdAt))
    .limit(1);

  if (otpRecord) {
    const inputHash = hashValue(parsed.data.otp);
    if (otpRecord.codeHash !== inputHash) {
      await db.update(otpCodesTable).set({ attempts: otpRecord.attempts + 1 }).where(eq(otpCodesTable.id, otpRecord.id));
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }
    await db.update(otpCodesTable).set({ consumedAt: new Date() }).where(eq(otpCodesTable.id, otpRecord.id));
  } else if (useTwilio) {
    // No local record — try Twilio Verify check (for fully verified numbers on paid plan)
    const approved = await verifyOtpWithTwilio(phone, parsed.data.otp);
    if (!approved) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }
  } else {
    res.status(400).json({ error: "OTP expired or not found" });
    return;
  }

  const defaultName = parsed.data.name?.trim() || `User ${phone.slice(-4)}`;
  const user = await findOrCreateUser(phone, defaultName);
  const tokens = await issueTokens(user.id, user.phone);
  res.json({ user, token: tokens.accessToken, ...tokens });
});

router.post("/auth/refresh", async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const token = parsed.data.refreshToken;
  let payload: { sub: string; jti: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  const [stored] = await db.select().from(refreshTokensTable).where(eq(refreshTokensTable.jti, payload.jti)).limit(1);
  if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
    res.status(401).json({ error: "Refresh token revoked or expired" });
    return;
  }
  if (stored.tokenHash !== hashValue(token)) {
    res.status(401).json({ error: "Refresh token mismatch" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  await db.update(refreshTokensTable).set({ revokedAt: new Date() }).where(eq(refreshTokensTable.jti, payload.jti));
  const tokens = await issueTokens(user.id, user.phone);
  res.json(tokens);
});

router.post("/auth/logout", async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    await db.update(refreshTokensTable).set({ revokedAt: new Date() }).where(eq(refreshTokensTable.jti, payload.jti));
  } catch {
    // Ignore malformed/expired tokens to keep logout idempotent.
  }
  res.json({ success: true });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  const user = getUser(req);
  res.json({ user });
});

export default router;
