"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, ArrowRight } from "lucide-react";

interface PhoneOtpFormProps {
  callbackUrl?: string;
}

export function PhoneOtpForm({ callbackUrl = "/explore" }: PhoneOtpFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const formatPhone = (value: string) => {
    // Auto-format: add + if not present
    if (!value.startsWith("+")) return "+" + value.replace(/[^0-9]/g, "");
    return "+" + value.slice(1).replace(/[^0-9]/g, "");
  };

  const sendOTP = async () => {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json() as { sent?: boolean; error?: string };
      if (!data.sent) {
        setError(data.error ?? "Failed to send OTP");
      } else {
        setStep("otp");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  const verifyOTP = async () => {
    setError(null);
    setVerifying(true);
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      setVerifying(false);
      return;
    }

    const result = await signIn("phone", {
      phone,
      otp: code,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid or expired code. Please try again.");
    } else {
      router.push(callbackUrl);
    }
    setVerifying(false);
  };

  if (step === "phone") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606060]" />
            <Input
              id="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              className="pl-10"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && sendOTP()}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button
          onClick={sendOTP}
          size="lg"
          className="w-full"
          disabled={sending || phone.length < 8}
        >
          {sending ? "Sending..." : "Send Code"}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#a0a0a0] text-center">
        Enter the 6-digit code sent to{" "}
        <span className="text-[#f0f0f0] font-medium">{phone}</span>
      </p>

      <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            className="w-11 h-12 text-center text-lg font-semibold rounded-lg border border-[#2a2a2a] bg-[#141414] text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#7c5af5] focus:border-[#7c5af5] transition-colors"
          />
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 text-center">
          {error}
        </div>
      )}

      <Button
        onClick={verifyOTP}
        size="lg"
        className="w-full"
        disabled={verifying || otp.join("").length !== 6}
      >
        {verifying ? "Verifying..." : "Verify & Sign In"}
      </Button>

      <button
        onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError(null); }}
        className="w-full text-sm text-[#a0a0a0] hover:text-[#f0f0f0] transition-colors"
      >
        Change phone number
      </button>
    </div>
  );
}
