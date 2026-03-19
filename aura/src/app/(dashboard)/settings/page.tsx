"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Gem, User, Shield, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  name: z.string().min(1).max(100),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const PLAN_DETAILS = {
  FREE:       { label: "Free",       price: "$0",   credits: "25/mo" },
  BASIC:      { label: "Basic",      price: "$10",  credits: "200/mo" },
  PRO:        { label: "Pro",        price: "$30",  credits: "1,000/mo" },
  ENTERPRISE: { label: "Enterprise", price: "Custom", credits: "Unlimited" },
} as const;

export default function SettingsPage() {
  const utils = trpc.useUtils();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { data: user, isLoading } = trpc.users.me.useQuery();

  const updateMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => utils.users.me.invalidate(),
  });

  const changePasswordMutation = trpc.users.changePassword.useMutation({
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError(null);
      setShowPasswordForm(false);
      passwordForm.reset();
      setTimeout(() => setPasswordSuccess(false), 4000);
    },
    onError: (err) => {
      setPasswordError(err.message);
    },
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onProfileSubmit = (data: { name: string }) => updateMutation.mutate(data);

  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    setPasswordError(null);
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  if (isLoading) return null;

  const plan = (user?.plan ?? "FREE") as keyof typeof PLAN_DETAILS;
  const planDetails = PLAN_DETAILS[plan];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-[#f0f0f0] tracking-tight">
          Settings
        </h1>
        <p className="text-[#a0a0a0] mt-1">Manage your account</p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-[#7c5af5]" />
          <h2 className="text-lg font-semibold text-[#f0f0f0]">Profile</h2>
        </div>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input placeholder="Your name" {...profileForm.register("name")} />
            {profileForm.formState.errors.name && (
              <p className="text-xs text-red-400">{profileForm.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? "—"} disabled className="opacity-60" />
          </div>

          {user?.phone && (
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={user.phone} disabled className="opacity-60" />
            </div>
          )}

          <Button
            type="submit"
            disabled={profileForm.formState.isSubmitting || updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </section>

      {/* Plan & Credits */}
      <section className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-[#7c5af5]" />
          <h2 className="text-lg font-semibold text-[#f0f0f0]">Plan & Credits</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#f0f0f0] font-medium">{planDetails.label} Plan</span>
              <Badge>{planDetails.price}/mo</Badge>
            </div>
            <p className="text-sm text-[#606060] mt-0.5">{planDetails.credits} credits</p>
          </div>
          <Button variant="secondary" size="sm">Upgrade</Button>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
          <Gem className="h-8 w-8 text-[#7c5af5]" />
          <div>
            <p className="text-2xl font-bold text-[#f0f0f0]">{user?.credits ?? 0}</p>
            <p className="text-xs text-[#606060]">credits remaining</p>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-[#7c5af5]" />
          <h2 className="text-lg font-semibold text-[#f0f0f0]">Security</h2>
        </div>

        {/* Success message */}
        {passwordSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            Password changed successfully.
          </div>
        )}

        {!showPasswordForm ? (
          <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
            Change Password
          </Button>
        ) : (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                {...passwordForm.register("currentPassword")}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-red-400">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                {...passwordForm.register("newPassword")}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-red-400">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-400">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {passwordError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "Saving..." : "Update Password"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordError(null);
                  passwordForm.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
