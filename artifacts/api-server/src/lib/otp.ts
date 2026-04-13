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
    console.log(`[OTP][DEV] ${phone} -> ${_code}`);
    return;
  }

  try {
    const client = twilio(accountSid, authToken);
    const verification = await client.verify.v2.services(serviceSid).verifications.create({
      to: phone,
      channel: "sms",
    });
    console.log(`[OTP] status=${verification.status} to=${phone}`);
  } catch (err: any) {
    // Twilio trial: unverified numbers are blocked — fall back to console log
    console.error(`[OTP][TWILIO ERROR] ${err?.message}`);
    console.log(`[OTP][FALLBACK] code for ${phone} -> ${_code}`);
    // Re-throw so the route can surface the error if needed
    throw err;
  }
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
