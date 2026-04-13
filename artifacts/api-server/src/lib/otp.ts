import { createHash } from "node:crypto";

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function sendOtp(phone: string, code: string): Promise<void> {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;

  if (!apiKey || !username) {
    console.log(`[OTP][DEV] ${phone} -> ${code}`);
    return;
  }

  // Africa's Talking SDK
  const AfricasTalking = (await import("africastalking" as any) as any).default ?? (await import("africastalking" as any) as any);
  const at = AfricasTalking({ apiKey, username });
  const sms = at.SMS;

  try {
    const result = await sms.send({
      to: [phone],
      message: `Your Tiyeni verification code is: ${code}. Valid for 5 minutes.`,
      // No 'from' needed for sandbox; set to your shortcode in production
    });
    console.log(`[OTP][AT] status=${result.SMSMessageData?.Recipients?.[0]?.status} to=${phone}`);
  } catch (err: any) {
    console.error(`[OTP][AT ERROR] ${err?.message}`);
    throw err;
  }
}
