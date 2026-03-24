import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-[#1e1e2e]", className)}
      {...props}
    />
  )
}

// Custom skeleton components for the app
export function WorkflowCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#111118] border border-[#1e1e2e]">
      <div className="aspect-[3/4] bg-[#1e1e2e]" />
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 bg-[#2a2a2a]" />
        <Skeleton className="h-3 w-1/2 bg-[#2a2a2a]" />
      </div>
    </div>
  )
}

export function GenerationCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-[#111118] border border-[#1e1e2e]">
      <div className="aspect-square bg-[#1e1e2e]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3 space-y-2">
        <Skeleton className="h-3 w-2/3 bg-[#2a2a2a]" />
        <Skeleton className="h-2 w-1/3 bg-[#2a2a2a]" />
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#1e1e2e] bg-[#111118] p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg bg-[#2a2a2a]" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-16 bg-[#2a2a2a]" />
          <Skeleton className="h-3 w-24 bg-[#2a2a2a]" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton }
