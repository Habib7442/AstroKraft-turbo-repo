import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "@/components/product-card-skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:py-14">
        <Skeleton className="h-3 w-24" />

        <div className="mt-4 mb-10">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="mt-3 h-4 w-40" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
