"use client";

import { useCountUp } from "@/hooks/use-count-up";

/**
 * The four numbers, as a ribbon welded under the hero.
 *
 * Deliberately **not** the Dashboard's `StatTiles`. That component is four
 * separate 96px cards, each with a 28px figure and a tinted circle icon on the
 * right, and it is the single strongest "you are on the Dashboard" signal in
 * the app — borrowing it made this page read as a second dashboard rather than
 * as the campaign surface it is.
 *
 * This is one continuous strip instead: segments divided by rules, a smaller
 * figure, the label above it rather than below, and no icons at all. It also
 * sits *attached* to the featured hero rather than above it, so the page opens
 * on artwork and the counts read as that block's base — which is the shape a
 * merchandising page has and a dashboard does not.
 *
 * The last segment carries the page's actual job — clients who qualify and have
 * not been asked — so it is the only one drawn in the orange accent this
 * section uses for anything time-sensitive. The other three are context.
 */
export type CampaignSummaryStat = {
  id: string;
  label: string;
  value: number;
  /** Draws the figure in the section's orange accent. One segment at most. */
  accent?: boolean;
};

export function CampaignSummaryBar({
  stats,
  welded = true,
}: {
  stats: CampaignSummaryStat[];
  /**
   * There is a hero above to be welded to. `false` when nothing is featured,
   * in which case the ribbon is the whole block and its top rule would be a
   * stray line across the inside of the border.
   */
  welded?: boolean;
}) {
  return (
    // 2×2 on a phone, one row from `sm`. The dividers are drawn per-segment
    // rather than with `divide-x` so the wrapped row doesn't grow a stray rule
    // down its left edge.
    <div
      className={`grid grid-cols-2 bg-card sm:grid-cols-4 ${
        welded ? "border-t border-border" : ""
      }`}
    >
      {stats.map((stat, i) => (
        <SummarySegment
          key={stat.id}
          stat={stat}
          // No left rule on the first of each row.
          leading={i % 2 === 0 ? "max-sm:border-l-0" : ""}
          first={i === 0}
        />
      ))}
    </div>
  );
}

function SummarySegment({
  stat,
  leading,
  first,
}: {
  stat: CampaignSummaryStat;
  leading: string;
  first: boolean;
}) {
  const animated = useCountUp(stat.value);
  const quiet = stat.value === 0;

  return (
    <div
      className={`flex flex-col gap-1 border-border px-4 py-3.5 max-sm:[&:nth-child(n+3)]:border-t sm:px-5 ${
        first ? "" : "border-l"
      } ${leading}`}
    >
      <p className="truncate text-[11.5px] font-medium leading-tight text-muted-foreground">
        {stat.label}
      </p>
      <p
        className={`text-[22px] font-bold leading-none tabular-nums ${
          quiet
            ? "text-[var(--text-default-placeholder)]"
            : stat.accent
              ? "text-[var(--accent-orange)]"
              : "text-foreground"
        }`}
      >
        {Math.round(animated)}
      </p>
    </div>
  );
}
