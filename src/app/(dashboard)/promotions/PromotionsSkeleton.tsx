"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { PROMOTIONS_GRID_CSS } from "./promotions-grid-css";

/**
 * Mirrors the list page's shape, so it doesn't jump when the data arrives.
 *
 * Bound to `useCampaigns().isLoading`, which is `false` today and starts going
 * `true` the moment that hook is given a real endpoint — see `@/hooks/use-api`
 * for why the resource carries the flag rather than the screen owning one.
 */
export function PromotionsSkeleton() {
  return (
    <div className="flex flex-col gap-4 xl:gap-5">
      {/* Its own copy rather than the page's: this also serves as the Suspense
          fallback, which renders before the page component exists. */}
      <style>{PROMOTIONS_GRID_CSS}</style>
      {/* Hero block: artwork with the counts welded under it, as one surface. */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Skeleton className="h-[240px] rounded-none sm:h-[300px] xl:h-[340px]" />
        <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`flex flex-col gap-2 border-border px-4 py-3.5 sm:px-5 ${
                i === 0 ? "" : "border-l"
              } ${i % 2 === 0 ? "max-sm:border-l-0" : ""} max-sm:[&:nth-child(n+3)]:border-t`}
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-10" />
            </div>
          ))}
        </div>
      </div>

      <Skeleton className="h-8 w-72 rounded-lg" />

      {/* Search, plus the button the four filters live behind. */}
      <div className="flex gap-2.5">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 w-[116px] shrink-0 rounded-lg" />
      </div>

      <div className="promotions-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[386px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
