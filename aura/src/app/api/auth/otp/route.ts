import { NextRequest, NextResponse } from "next/server";
import { checkOTPRateLimit } from "@/lib/redis";
import { z } from "zod";

const schema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Invalid phone number format"),
});

export async function POST(req: NextRequest) {
  const body = await req.json() as unknown;
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid phone number" },
      { status: 400 }
    );
  }

  const { phone } = parsed.data;

  // Rate limit: 3 OTPs per phone per 10 minutes
  const allowed = await checkOTPRateLimit(phone);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many OTP requests. Please wait 10 minutes." },
      { status: 429 }
    );
  }

  // Send OTP via Twilio
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!twilioAccountSid || !twilioAuthToken || !twilioServiceSid) {
    return NextResponse.json(
      { error: "OTP service not configured" },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${twilioServiceSid}/Verifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({ To: phone, Channel: "sms" }).toString(),
      }
    );

    const data = await response.json() as { sid?: string; status?: string };

    if (!data.sid) {
      return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("Twilio error:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
