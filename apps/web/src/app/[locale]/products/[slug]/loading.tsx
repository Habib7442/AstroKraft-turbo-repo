import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 pt-6">
        <Skeleton className="h-3 w-24" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 py-8 lg:grid-cols-2 lg:py-12">
        <Skeleton className="aspect-square w-full rounded-lg" />

        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />

          <div className="grid grid-cols-3 gap-2.5">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>

          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </main>
  );
}
