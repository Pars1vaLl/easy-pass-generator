"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { Sparkles, Gem, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface UserInputField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "slider" | "toggle";
  placeholder?: string;
  required: boolean;
  maxLength?: number;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  default?: unknown;
}

interface WorkflowCreatorProps {
  workflowId: string;
  workflowName: string;
  workflowSlug: string;
  previewUrls: string[];
  creditCost: number;
  userInputSchema: UserInputField[];
}

const MAX_PROMPT = 500;

export function WorkflowCreator({
  workflowId,
  workflowName,
  previewUrls,
  creditCost,
  userInputSchema,
}: WorkflowCreatorProps) {
  const router = useRouter();
  const [charCount, setCharCount] = useState(0);

  const createMutation = trpc.generations.create.useMutation({
    onSuccess: () => {
      router.push("/gallery");
    },
  });

  const schema = z.object({
    userPrompt: z.string().min(1, "Please describe your vision").max(MAX_PROMPT),
    params: z.record(z.string(), z.unknown()).optional(),
  });

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: { userPrompt: string; params?: Record<string, unknown> }) => {
    createMutation.mutate({
      workflowId,
      userPrompt: data.userPrompt,
      params: data.params,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/explore">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-display font-bold text-[#f0f0f0]">
            {workflowName}
          </h1>
          <p className="text-sm text-[#a0a0a0]">
            Customize and generate your creation
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-sm text-[#c4b5fd]">
          <Gem className="h-4 w-4" />
          <span>{creditCost} credit{creditCost !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Preview images */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previewUrls.slice(0, 4).map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
              <Image
                src={url}
                alt={`Preview ${i + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Main prompt */}
        <div className="space-y-2">
          <Label>Describe your vision</Label>
          <div className="relative">
            <Textarea
              placeholder="A majestic mountain at golden hour, with mist rolling through the valleys..."
              rows={4}
              className="resize-none text-base pr-16"
              {...register("userPrompt", {
                onChange: (e) => setCharCount(e.target.value.length),
              })}
            />
            <span className={`absolute bottom-2 right-3 text-xs ${
              charCount > MAX_PROMPT * 0.9 ? "text-[#f59e0b]" : "text-[#606060]"
            }`}>
              {charCount} / {MAX_PROMPT}
            </span>
          </div>
          {errors.userPrompt && (
            <p className="text-xs text-red-400">
              {errors.userPrompt.message as string}
            </p>
          )}
        </div>

        {/* Dynamic fields */}
        {userInputSchema.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-[#7c5af5] ml-1">*</span>}
            </Label>

            {field.type === "text" && (
              <Input
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                {...register(`params.${field.name}`)}
              />
            )}

            {field.type === "textarea" && (
              <Textarea
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                {...register(`params.${field.name}`)}
              />
            )}

            {field.type === "select" && field.options && (
              <Controller
                name={`params.${field.name}` as never}
                control={control}
                defaultValue={field.default as never}
                render={({ field: f }) => (
                  <select
                    {...f}
                    className="w-full h-10 rounded-lg border border-[#2a2a2a] bg-[#141414] px-3 text-sm text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#7c5af5]"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            )}

            {field.type === "slider" && (
              <Controller
                name={`params.${field.name}` as never}
                control={control}
                defaultValue={(field.default ?? field.min ?? 0) as never}
                render={({ field: f }) => (
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={field.min ?? 0}
                      max={field.max ?? 100}
                      {...f}
                      className="w-full accent-[#7c5af5]"
                    />
                    <div className="flex justify-between text-xs text-[#606060]">
                      <span>{field.min ?? 0}</span>
                      <span className="text-[#a0a0a0] font-medium">{f.value}</span>
                      <span>{field.max ?? 100}</span>
                    </div>
                  </div>
                )}
              />
            )}

            {field.type === "toggle" && (
              <Controller
                name={`params.${field.name}` as never}
                control={control}
                defaultValue={(field.default ?? false) as never}
                render={({ field: f }) => (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => f.onChange(!f.value)}
                      className={`relative w-10 h-6 rounded-full transition-colors ${
                        f.value ? "bg-[#7c5af5]" : "bg-[#2a2a2a]"
                      }`}
                    >
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        f.value ? "translate-x-5" : "translate-x-1"
                      }`} />
                    </div>
                    <span className="text-sm text-[#a0a0a0]">{field.placeholder ?? "Enabled"}</span>
                  </label>
                )}
              />
            )}
          </div>
        ))}

        {/* Error */}
        {createMutation.error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {createMutation.error.message}
          </div>
        )}

        {/* Submit */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            size="xl"
            variant="gradient"
            className="w-full"
            disabled={createMutation.isPending}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {createMutation.isPending ? "Creating..." : `✨ Create  (costs ${creditCost} credit${creditCost !== 1 ? "s" : ""})`}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
