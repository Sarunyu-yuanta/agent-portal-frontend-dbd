"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button, Card, Chip, TabGroup } from "@sarunyu/system-one";
import { ArrowLeftIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollTopOnChange } from "@/hooks/use-scroll-top";
import { useSectionBack } from "@/hooks/use-section-back";
import { setQueryState, withQuery } from "@/lib/query-state";
import type { RiskAlertCategory, RiskSeverity } from "@/types/domain";
import { CardCount } from "../CardHeader";
import {
  RISK_ALERTS_TITLE,
  RiskAlertRowItem,
  RiskSeverityStrip,
} from "../RiskAlertsPanel";
import { RiskAlertDetail } from "../RiskAlertDetail";
import {
  RISK_CATEGORY_META,
  RISK_CATEGORY_ORDER,
  SEVERITY_ORDER,
} from "../risk-config";
import {
  countRiskByCategory,
  countRiskBySeverity,
  type RiskAlertRow,
} from "../risk-feed";
import { useRiskAlertRows } from "../use-risk-alert-rows";

const CATEGORY_TABS: { id: RiskAlertCategory | "all"; title: string }[] = [
  { id: "all", title: "ทั้งหมด" },
  ...RISK_CATEGORY_ORDER.map((id) => ({ id, title: RISK_CATEGORY_META[id].label })),
];

/**
 * Every risk finding across the book, filtered.
 *
 * The Command Center card names the most pressing few; this is where "ดูทั้งหมด"
 * lands — and it is also the only place a finding that has been acknowledged
 * can be found again, which is why the card links here even when nothing has
 * been cut.
 *
 * Drawn with the card's own rows rather than a table, for the reason
 * `next-best-actions/page.tsx` gives about this folder: these rows are not all
 * the same shape. Most carry no deadline, one carries no client at all, and the
 * figure that triggered one is not the figure that triggered the next — a fixed
 * column set would be mostly empty cells. It also means no mobile/desktop
 * split: a flex row drops its figure under `sm` and truncates, where a table's
 * columns cannot shrink below their own content.
 */
export default function RiskAlertsPage() {
  // The filters live in the URL, so a bookmarked "critical only" view reopens as
  // one and the Dashboard card's severity strip can link straight into it.
  // `useSearchParams` suspends, hence the boundary.
  return (
    <Suspense fallback={<RiskAlertsSkeleton />}>
      <RiskAlertsPageInner />
    </Suspense>
  );
}

function RiskAlertsPageInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { rows, acknowledgedRows, isLoading, acknowledge, unacknowledge } =
    useRiskAlertRows();
  // Falls back to the Command Center on a cold entry — a pasted link, or a
  // session restored straight onto this page with no trail to walk up.
  const goBack = useSectionBack(() => "/command-center");
  // Opened from a Dashboard that was scrolled down.
  useScrollTopOnChange([]);

  const [detail, setDetail] = useState<RiskAlertRow | null>(null);

  const showAck = searchParams.get("ack") === "1";
  const categoryParam = searchParams.get("category");
  const category: RiskAlertCategory | "all" =
    CATEGORY_TABS.find((t) => t.id === categoryParam)?.id ?? "all";
  const severityParam = searchParams.get("severity");
  const severity: RiskSeverity | null = SEVERITY_ORDER.includes(
    severityParam as RiskSeverity,
  )
    ? (severityParam as RiskSeverity)
    : null;

  // `replace`, not `push` — narrowing a list is a refinement, not a
  // destination, and it should not fill history with entries the reader has to
  // click back through to leave the page.
  const update = (patch: Record<string, string | null>) =>
    setQueryState(withQuery(pathname, searchParams, patch), "replace");

  /** The pool every count is taken from, so a tab's number and the list under
   *  it are the same objects and cannot drift. */
  const pool = useMemo(
    () => (showAck ? [...rows, ...acknowledgedRows] : rows),
    [rows, acknowledgedRows, showAck],
  );

  const visible = useMemo(
    () =>
      pool.filter(
        (row) =>
          (category === "all" || row.alert.category === category) &&
          (severity === null || row.alert.severity === severity),
      ),
    [pool, category, severity],
  );

  const categoryCounts = useMemo(() => countRiskByCategory(pool), [pool]);
  /** Severity counts follow the chosen category, so the chip numbers describe
   *  the list the reader is actually looking at. */
  const severityCounts = useMemo(
    () =>
      countRiskBySeverity(
        category === "all"
          ? pool
          : pool.filter((row) => row.alert.category === category),
      ),
    [pool, category],
  );

  const filtered = category !== "all" || severity !== null;

  return (
    /* `xl:pb-20` clears the floating "New note" button the shell pins at
       `bottom-8 right-8` from `xl` up — see the Call Log page for the same. */
    <div className="flex flex-col gap-4 xl:gap-5 xl:pb-20">
      <div className="flex items-center gap-2">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={goBack}
          aria-label="กลับไปหน้า Dashboard"
          className="shrink-0"
        >
          <ArrowLeftIcon size={18} />
        </Button>
        {/* `type-h6` here and `type-subtitle-1` on the card is deliberate: this is
            a page title, matching the Call Log and Next Best Actions pages, where
            the card heading matches the cards beside it. */}
        <h1 className="type-h6 text-foreground">{RISK_ALERTS_TITLE}</h1>
        {/* The count follows the filters — a page showing four rows under an
            "11" reads as though seven went missing. */}
        {visible.length > 0 && <CardCount value={visible.length} />}
        <span className="flex-1" />
        <Chip
          label="รวมรายการที่รับทราบแล้ว"
          type="multiple"
          size="small"
          selected={showAck}
          onClick={() => update({ ack: showAck ? null : "1" })}
        />
      </div>

      {/* Category first — it is the *kind of thing*, which is what a tab strip
          is for, and the per-family counts are what makes the handoff from the
          card worth taking.

          Three classes, all working around `system-one`'s unlayered stylesheet:
          `scrollable-tabs` keeps five Thai labels from truncating and lets them
          swipe on a phone; `transparent-tabs` cancels the `bg-background` the
          component paints over the page's grey; `count-tabs` repaints the
          `notification` badge from the library's always-red to a quiet grey
          pill — red here would say every category is on fire. */}
      <div className="scrollable-tabs transparent-tabs count-tabs">
        <TabGroup
          items={CATEGORY_TABS.map((tab) => ({
            id: tab.id,
            title: tab.title,
            // `|| undefined` so a family with nothing open shows no badge at
            // all rather than a "0" the eye has to read and discard.
            notification:
              tab.id === "all"
                ? pool.length || undefined
                : categoryCounts[tab.id] || undefined,
          }))}
          activeId={category}
          size="md"
          onChange={(id) => update({ category: id === "all" ? null : id })}
        />
      </div>

      {/* Severity, as the same strip the Command Center card carries — one
          definition of this control, so the two surfaces cannot disagree about
          what the levels are or how many of each there are. It replaced a
          second row of `Chip`s that sat here doing the identical job.

          `total` follows the chosen category, so the strip describes the list
          under it rather than the whole book. */}
      <RiskSeverityStrip
        counts={severityCounts}
        total={category === "all" ? pool.length : categoryCounts[category]}
        value={severity}
        onChange={(next) => update({ severity: next })}
      />

      <Card variant="default" className="gap-4">
        {/* Loading above empty — the project-wide rule. The other order flashes
            "ไม่มีรายการความเสี่ยง" on every visit the moment this feed has a
            real endpoint. */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[62px] rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={
              <ShieldCheckIcon
                size={40}
                weight="duotone"
                className="text-[var(--text-default-placeholder)]"
              />
            }
            title={
              filtered
                ? "ไม่พบรายการตามตัวกรอง"
                : showAck
                  ? "ยังไม่มีรายการที่รับทราบ"
                  : "ไม่มีรายการความเสี่ยงค้างอยู่"
            }
            body={
              filtered
                ? "ลองเลือกหมวดหรือระดับความเสี่ยงอื่น หรือล้างตัวกรองเพื่อดูทั้งหมด"
                : "ระบบจะแจ้งเตือนทันทีเมื่อพบความเสี่ยงด้านมาร์จิ้น บัญชีม้า ความเหมาะสมของการลงทุน หรือพฤติกรรมการซื้อขาย"
            }
            action={
              filtered
                ? {
                    label: "ล้างตัวกรอง",
                    onClick: () => update({ category: null, severity: null }),
                  }
                : undefined
            }
          />
        ) : (
          <>
            {/* Keyed on the filters, so switching either replays the fade — the
                rows change completely in both cases. Same as `orders`. */}
            <FadeIn key={`${category}|${severity}|${showAck}`}>
              <div className="overflow-hidden rounded-2xl bg-[var(--bg-default-secondary)] divide-y divide-black/[0.05]">
                {visible.map((row) => (
                  <RiskAlertRowItem
                    key={row.alert.id}
                    row={row}
                    onOpen={() => setDetail(row)}
                  />
                ))}
              </div>
            </FadeIn>
          </>
        )}
      </Card>

      <RiskAlertDetail
        row={detail}
        onClose={() => setDetail(null)}
        onAcknowledge={(alert) => {
          setDetail(null);
          acknowledge(alert);
        }}
        onUnacknowledge={(alert) => {
          setDetail(null);
          unacknowledge(alert);
        }}
      />
    </div>
  );
}

function RiskAlertsSkeleton() {
  return (
    <div className="flex flex-col gap-4 xl:gap-5 xl:pb-20">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full max-w-[560px] rounded-xl" />
      <Skeleton className="h-7 w-[320px] rounded-full" />
      <Card variant="default" className="gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[62px] rounded-xl" />
        ))}
      </Card>
    </div>
  );
}
