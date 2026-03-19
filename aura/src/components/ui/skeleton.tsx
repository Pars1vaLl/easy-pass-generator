import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-r from-[#111118] via-[#1a1a24] to-[#111118] bg-[length:200%_100%]",
        "animate-[shimmer_1.8s_ease-in-out_infinite]",
        className
      )}
    />
  );
}

export function WorkflowCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
    </div>
  );
}

export function GenerationCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-[#111118]">
      <Skeleton className="aspect-square w-full rounded-xl" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#1e1e2e] bg-[#111118] p-4 text-center">
      <Skeleton className="h-8 w-16 mx-auto mb-1 rounded-lg" />
      <Skeleton className="h-3 w-12 mx-auto rounded" />
    </div>
  );
}
