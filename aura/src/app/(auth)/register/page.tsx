import Link from "next/link";
import { Zap } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-2xl p-8 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-[#f0f0f0] tracking-tight">
              Start creating
            </h1>
            <p className="text-sm text-[#a0a0a0] mt-1">
              25 free credits — no credit card required
            </p>
          </div>
        </div>

        <OAuthButtons />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2a2a2a]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0d0d0d] px-3 text-[#606060]">or sign up with email</span>
          </div>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-[#606060]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#7c5af5] hover:text-[#c4b5fd] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
