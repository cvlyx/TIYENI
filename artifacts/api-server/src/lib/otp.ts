import { createHash } from "node:crypto";
import twilio from "twilio";

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function sendOtp(phone: string, _code: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    // Fallback for local dev when Twilio env vars are not set
    console.log(`[OTP][DEV] ${phone} -> ${_code}`);
    return;
  }

  const client = twilio(accountSid, authToken);
  await client.verify.v2.services(serviceSid).verifications.create({
    to: phone,
    channel: "sms",
  });
}

export async function verifyOtpWithTwilio(
  phone: string,
  code: string
): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    // In dev without Twilio, skip remote check (local DB check handles it)
    return true;
  }

  const client = twilio(accountSid, authToken);
  const check = await client.verify.v2.services(serviceSid).verificationChecks.create({
    to: phone,
    code,
  });

  return check.status === "approved";
}
