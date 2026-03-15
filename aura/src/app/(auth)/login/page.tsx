"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { PhoneOtpForm } from "@/components/auth/PhoneOtpForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export default function LoginPage() {
  const [tab, setTab] = useState<"email" | "phone">("email");

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-2xl p-8 space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-[#f0f0f0] tracking-tight">
              Welcome to AURA
            </h1>
            <p className="text-sm text-[#a0a0a0] mt-1">
              AI-powered creative platform
            </p>
          </div>
        </div>

        {/* OAuth */}
        <OAuthButtons />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2a2a2a]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0d0d0d] px-3 text-[#606060]">or continue with</span>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-lg border border-[#2a2a2a] p-1 bg-[#141414]">
          <button
            onClick={() => setTab("email")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              tab === "email"
                ? "bg-[#2a2a2a] text-[#f0f0f0]"
                : "text-[#606060] hover:text-[#a0a0a0]"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setTab("phone")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              tab === "phone"
                ? "bg-[#2a2a2a] text-[#f0f0f0]"
                : "text-[#606060] hover:text-[#a0a0a0]"
            }`}
          >
            Phone
          </button>
        </div>

        {tab === "email" ? <LoginForm /> : <PhoneOtpForm />}

        <p className="text-center text-sm text-[#606060]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#7c5af5] hover:text-[#c4b5fd] font-medium">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
