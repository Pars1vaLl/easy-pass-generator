import Link from "next/link";
import { Zap } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <div className="gradient-border-wrap rounded-2xl">
        <div className="glass-card rounded-2xl p-8 space-y-6">

          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[#7c5af5]/30 blur-xl scale-110" />
              <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-[#7c5af5] to-[#6366f1] flex items-center justify-center shadow-glow-lg">
                <Zap className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-display font-bold text-[#f0f0f0] tracking-tight">
                Start{" "}
                <span className="gradient-text">creating</span>
              </h1>
              <p className="text-sm text-[#4b5563] mt-1">
                25 free credits — no credit card required
              </p>
            </div>
          </div>

          {/* OAuth */}
          <OAuthButtons />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e1e2e]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#111118] px-3 text-[#4b5563]">or sign up with email</span>
            </div>
          </div>

          <RegisterForm />

          <p className="text-center text-sm text-[#4b5563]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#7c5af5] hover:text-[#a78bfa] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
