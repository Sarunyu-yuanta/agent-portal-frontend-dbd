"use client";

import { Card } from "@sarunyu/system-one";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the detail page's shape, so it doesn't jump when the data arrives.
 * Bound to `useCampaign().isLoading` — see `@/hooks/use-api` for why the
 * resource carries the flag rather than the screen owning one.
 */
export function CampaignDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-12">
      <Skeleton className="hidden h-7 w-16 rounded-md xl:block" />
      <Skeleton className="h-[180px] rounded-2xl sm:h-[240px] xl:h-[280px]" />

      <Card variant="default" className="gap-0 p-0!">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2.5 p-4">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <div className="flex w-full flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div
        className="flex flex-col gap-8 lg:grid lg:gap-8"
        style={{ gridTemplateColumns: "minmax(0, 1fr) 360px", alignItems: "start" }}
      >
        <div className="flex min-w-0 flex-col gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
          <Skeleton className="h-[320px] rounded-lg" />
        </div>

        <Card variant="default" className="gap-4">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[112px] rounded-xl" />
          ))}
        </Card>
      </div>
    </div>
  );
}
