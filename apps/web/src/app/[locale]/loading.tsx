import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "@/components/product-card-skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="h-[360px] w-full" style={{ background: "linear-gradient(135deg, #0B1026 0%, #2A1A5E 50%, #4C1D95 100%)" }} />

      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />

        <div className="mt-10 flex gap-4 overflow-hidden sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} className="w-[220px] shrink-0 sm:w-[260px]" />
          ))}
        </div>
      </div>
    </main>
  );
}
