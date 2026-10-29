import { Skeleton } from "@/components/ui/skeleton";

/** One book's page while the product and its bookings resolve. */
export function OrderBookDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-[8px] border border-border bg-card p-5">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 rounded-[8px] border border-border bg-card p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
