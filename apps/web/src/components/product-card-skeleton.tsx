import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-card ${className}`}>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-1.5 p-4">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2.5 w-16" />
        <div className="flex gap-1 pt-0.5">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-14" />
        </div>
        <Skeleton className="mt-1 h-9 w-full rounded-md" />
      </div>
    </div>
  );
}
