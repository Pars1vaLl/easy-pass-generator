"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/toast";
import { compilePromptPreview, extractTemplateVariables } from "@/lib/compilePrompt";
import { Sparkles, Gem, ArrowLeft, History, ChevronDown, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { UserInputField } from "@/../../workers/types";

interface WorkflowCreatorProps {
  workflowId: string;
  workflowName: string;
  workflowSlug: string;
  previewUrls: string[];
  creditCost: number;
  userInputSchema: UserInputField[];
  promptTemplatePreview: { template?: string; prefix?: string; suffix?: string } | null;
}

const MAX_PROMPT = 500;

export function WorkflowCreator({
  workflowId,
  workflowName,
  workflowSlug,
  previewUrls,
  creditCost,
  userInputSchema,
  promptTemplatePreview,
}: WorkflowCreatorProps) {
  const router = useRouter();
  const toast = useToast();
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(!!promptTemplatePreview);
  const [submitted, setSubmitted] = useState(false);

  const { data: promptHistory } = trpc.promptHistory.list.useQuery(
    { workflowId, limit: 10 },
    { enabled: showHistory }
  );

  const createMutation = trpc.generations.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Generation started! Redirecting to gallery…");
      setTimeout(() => router.push("/gallery"), 1200);
    },
    onError: (err) => toast.error(err.message),
  });

  const schema = z.object({
    userPrompt: z.string().min(1, "Please describe your vision").max(MAX_PROMPT),
    params: z.record(z.string(), z.unknown()).optional(),
  });

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      userPrompt: "",
      params: Object.fromEntries(
        userInputSchema.map((f) => [f.name, f.default ?? ""])
      ),
    },
  });

  // Watch all values for live preview
  const watchedPrompt = useWatch({ control, name: "userPrompt" }) as string;
  const watchedParams = useWatch({ control, name: "params" }) as Record<string, unknown>;

  const compiledPreview = promptTemplatePreview
    ? compilePromptPreview(promptTemplatePreview, watchedPrompt || "…", watchedParams ?? {})
    : null;

  // Which template variables are referenced beyond userPrompt?
  const templateVars = promptTemplatePreview?.template
    ? extractTemplateVariables(promptTemplatePreview.template)
    : [];

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
          <h1 className="text-xl font-display font-bold text-[#f0f0f0]">{workflowName}</h1>
          <p className="text-sm text-[#a0a0a0]">Customize and generate your creation</p>
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
              <Image src={url} alt={`Preview ${i + 1}`} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Main prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Describe your vision</Label>
            <div className="flex items-center gap-3">
              {/* Toggle preview */}
              {compiledPreview !== null && (
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="flex items-center gap-1 text-xs text-[#606060] hover:text-[#a0a0a0] transition-colors"
                >
                  {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showPreview ? "Hide preview" : "Show preview"}
                </button>
              )}
              {/* Prompt history */}
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-1 text-xs text-[#7c5af5] hover:text-[#9b7fff] transition-colors"
              >
                <History className="h-3.5 w-3.5" />
                History
                <ChevronDown className={`h-3 w-3 transition-transform ${showHistory ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Prompt history dropdown */}
          {showHistory && (
            <div className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] divide-y divide-[#1a1a1a] max-h-48 overflow-y-auto">
              {!promptHistory || promptHistory.length === 0 ? (
                <p className="text-xs text-[#606060] px-3 py-2">No recent prompts</p>
              ) : (
                promptHistory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setValue("userPrompt", item.prompt);
                      setShowHistory(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#c0c0c0] hover:bg-[#1a1a1a] transition-colors truncate"
                  >
                    {item.prompt}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <Textarea
              placeholder="A majestic mountain at golden hour, with mist rolling through the valleys..."
              rows={4}
              className="resize-none text-base"
              maxLength={MAX_PROMPT}
              {...register("userPrompt")}
            />
            <span className={`absolute bottom-2 right-3 text-xs pointer-events-none ${
              (watchedPrompt?.length ?? 0) > MAX_PROMPT * 0.9 ? "text-[#f59e0b]" : "text-[#606060]"
            }`}>
              {watchedPrompt?.length ?? 0} / {MAX_PROMPT}
            </span>
          </div>
          {errors.userPrompt && (
            <p className="text-xs text-red-400">{errors.userPrompt.message as string}</p>
          )}
        </div>

        {/* Dynamic param fields */}
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
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
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

            {/* Hint if this field is referenced in the template */}
            {templateVars.includes(field.name) && (
              <p className="text-xs text-[#7c5af5]/70">
                Used in prompt as{" "}
                <code className="font-mono bg-[#1a1a1a] px-1 rounded">{`{{${field.name}}}`}</code>
              </p>
            )}
          </div>
        ))}

        {/* Live prompt preview */}
        {showPreview && compiledPreview !== null && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[#7c5af5]/30 bg-[#7c5af5]/5 p-4 space-y-1.5"
          >
            <p className="text-xs font-medium text-[#7c5af5] uppercase tracking-widest">
              Compiled prompt preview
            </p>
            <p className="text-sm text-[#c0c0c0] leading-relaxed break-words">
              {compiledPreview || <span className="text-[#606060] italic">Enter your prompt above…</span>}
            </p>
          </motion.div>
        )}

        {/* Post-submit success state */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#10b981]/30 bg-[#10b981]/10 px-4 py-3.5 flex items-center gap-3"
            >
              <CheckCircle2 className="h-5 w-5 text-[#10b981] flex-shrink-0" />
              <p className="text-sm text-[#34d399]">
                Generation queued! Redirecting to gallery…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        {!submitted && (
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              size="xl"
              variant="gradient"
              className="w-full h-12 text-base font-bold"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate — {creditCost} credit{creditCost !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </motion.div>
        )}
      </form>
    </div>
  );
}
