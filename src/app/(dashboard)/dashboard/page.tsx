"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@sarunyu/system-one";
import { useClientsResource } from "@/hooks/use-api";
import { useNotes } from "@/contexts/notes-context";
import { usePrivacy } from "@/contexts/privacy-context";
import { useStoredIds } from "@/hooks/use-stored-ids";
import { useScrollTopOnChange } from "@/hooks/use-scroll-top";
import { useStickyRailTop } from "@/hooks/use-sticky-rail";
import { NOTE_AUTHOR } from "../notes/note-constants";
import { getClientTotals } from "../client-hub/client-hub-data";
import { formatAumThb } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { Skeleton } from "@/components/ui/skeleton";
import { addMonths, todayDateKey } from "../calendar/calendar-grid";
import { useDayItemModals } from "../calendar/use-day-item-modals";
import { CardHeader } from "./CardHeader";
import { StatTiles, type StatTile } from "./StatTiles";
import { MiniCalendar } from "./MiniCalendar";
import { RemindersPanel } from "./RemindersPanel";
import {
  NBA_MESSAGE_BOOK,
  NbaComingSoonCard,
} from "./NbaComingSoonCard";
import { CallLogPanel } from "./CallLogPanel";
import { KycAlertsPanel } from "./KycAlertsPanel";
import { AssetSummaryPanel } from "./AssetSummaryPanel";
import { buildCallLog } from "./call-log-feed";
import {
  buildQueue,
  isQueueId,
  remindersByDay,
  remindersOnDay,
  HIDDEN_QUEUE_IDS_PREF,
  CALL_LOG_ROW_LIMIT,
  KYC_INLINE_DAYS,
} from "./dashboard-data";
import { useNbaRows } from "./use-nba-rows";

/**
 * The page an IC opens first.
 *
 * Its job is narrow on purpose: say what today asks for, who is worth a call,
 * and what the desk's view points at — then hand off. Nothing here is a place
 * to work for an hour; every card ends in a link into the section that owns the
 * subject.
 *
 * The shape is the work on the left — counts, then what to pitch, then where
 * the desk stands — beside a right rail of dated context: reminders, KYC
 * expiries, the month.
 *
 * The book itself is half of one row, sharing it with the call log — both are
 * standing-position rather than work, so neither gets a full-width turn. It
 * earns that place and no more: "how is the quarter going" is not the question
 * being asked at eight in the morning, and Client 360 already summarises the
 * book above the table those numbers describe. What this page still refuses to
 * be is a wall of AUM and revenue figures greeting you on open.
 *
 * See `dashboard-data` for what each block is derived from, and why the
 * derivations live there rather than in these components.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageInner />
    </Suspense>
  );
}

const PATH = "/dashboard";

/** Column widths, inlined for the reason this page already had to learn once:
 *  `@sarunyu/system-one` ships a plain `.grid-cols-1` and loads after
 *  `globals.css`, so it takes the source-order tie against any responsive
 *  `grid-cols-*` on the same element and the utility never takes. `!important`
 *  on a named class is the only thing that reliably wins. */
const DASHBOARD_RAIL_CSS = `
@media (min-width: 80rem) {
  .dashboard-split { grid-template-columns: minmax(0, 7fr) minmax(0, 3fr) !important; }
  .dashboard-rail { width: auto !important; min-width: 0 !important; max-width: none !important; }
}
`;

function DashboardPageInner() {
  const searchParams = useSearchParams();
  const { data: clients, isLoading } = useClientsResource();
  const { notes } = useNotes();
  const { isPrivate } = usePrivacy();

  /**
   * Rows the user has cleared. Lasting, not session — a KYC alert dismissed on
   * Monday must not be back on Tuesday morning, which is exactly what session
   * memory would do. The id carries the checkpoint, so it does come back when
   * the expiry gets closer.
   */
  const [hiddenIds] = useStoredIds<string>(
    HIDDEN_QUEUE_IDS_PREF,
    isQueueId,
  );
  const { rows: nbaRows, dismiss: dismissNba } = useNbaRows();

  // The modals a queue row opens — the same pair the bell and a client's
  // Reminders tab open, from the one definition. No `pinnedClientId`: this page
  // isn't standing on anyone's profile.
  const { open: openDayItem, modals } = useDayItemModals({ clients });

  // Anchored to the calendar day rather than a fresh `Date`, so the memos below
  // don't recompute on every render. Same pattern as the Overview tab's
  // reminders card.
  const todayKey = todayDateKey();
  const today = useMemo(() => new Date(todayKey), [todayKey]);

  const monthOffset = Number(searchParams.get("month")) || 0;
  const viewDate = useMemo(() => addMonths(today, monthOffset), [today, monthOffset]);

  const queue = useMemo(
    () => buildQueue({ clients, notes, today, isPrivate }),
    [clients, notes, today, isPrivate],
  );
  const live = useMemo(
    () => queue.filter((item) => !hiddenIds.has(item.id)),
    [queue, hiddenIds],
  );

  /** The card is always today. A day on the calendar opens its own popover. */
  const dayReminders = useMemo(
    () => remindersOnDay(notes, today, today),
    [notes, today],
  );
  const monthReminders = useMemo(
    () => remindersByDay(notes, viewDate, today),
    [notes, viewDate, today],
  );

  /** The same array the KYC tile counts, filtered by source — so the count and
   *  the list are the same objects and cannot drift apart. */
  const kycRows = useMemo(() => live.filter((i) => i.source === "kyc"), [live]);

  /**
   * The expiries that land on today, for the Reminders card above.
   *
   * Only today's. The card is a list of what is dated today and a KYC lapsing
   * this morning belongs on it — the Calendar's Reminder tab reached the same
   * conclusion. Taking the whole horizon instead would make the card a second
   * copy of the KYC card two rows below it, which is why the overlap stops at
   * the one row that genuinely is today's business.
   *
   * Sliced off `kycRows` rather than derived again, so the row in the Reminders
   * card and the row in the KYC card are the same object.
   */
  const todayKyc = useMemo(() => kycRows.filter((row) => row.daysLeft === 0), [kycRows]);

  const callLog = useMemo(() => buildCallLog(clients ?? [], isPrivate), [clients, isPrivate]);

  // Arriving from a sub-page — Call Log's back button, or the breadcrumb —
  // otherwise inherits that page's scroll offset and opens partway down.
  useScrollTopOnChange([]);

  const { railRef, railTop } = useStickyRailTop();

  // Resolved once here rather than per row: the queue, not the row, is the
  // thing that knows every client it mentions.
  const clientNames = useMemo(
    () => new Map(clients.map((c) => [c.id, maskName(c.name, isPrivate)])),
    [clients, isPrivate],
  );

  // `replace`, not `push` — narrowing a list shouldn't fill history with
  // entries the user has to click back through to leave the page.
  const updateQuery = useCallback(
    (updates: Record<string, string | null>) =>
      setQueryState(withQuery(PATH, searchParams, updates), "replace"),
    [searchParams],
  );

  const { totalAum } = useMemo(
    () => getClientTotals(clients ?? []),
    [clients],
  );
  const kycSoon = useMemo(
    () => live.filter((i) => !i.done && i.source === "kyc").length,
    [live],
  );

  const tiles: StatTile[] = useMemo(
    () => [
    {
      id: "clients",
      label: "จำนวน Client",
      value: clients?.length ?? 0,
      tone: "brand",
      icon: "users",
    },
    {
      id: "aum",
      label: "AUM รวมทั้งหมด",
      value: totalAum,
      tone: "violet",
      icon: "coins",
      formatValue: formatAumThb,
    },
    {
      id: "kyc",
      label: "KYC ใกล้หมดอายุ",
      value: kycSoon,
      tone: "warning",
      icon: "kyc",
    },
    ],
    [clients, totalAum, kycSoon],
  );

  if (isLoading) return <DashboardSkeleton />;

  return (
    <>
      <style>{DASHBOARD_RAIL_CSS}</style>
      <div className="flex flex-col gap-4 xl:gap-5">
        {/* Main + right rail — greeting and stat tiles live in the work column
            only, so their width matches the NBA card below. The calendar sits
            at the top of the right rail, level with the greeting, like the
            fitness-dashboard reference. */}
        <div className="dashboard-split grid grid-cols-1 gap-4 xl:gap-5 xl:items-start">
          <div className="min-w-0 flex flex-col gap-4 xl:gap-5 xl:col-start-1 xl:row-start-1 row-start-2">
            <Card
              variant="default"
              className="relative isolate gap-1 overflow-hidden bg-primary-action-light border-border"
            >
              {/* The Yuanta mark as a watermark: far larger than the card and
                  pushed off its right edge, so only part of it shows and it
                  reads as texture rather than a logo. Sized to roughly one and a
                  half times the card's height: bigger than that and the card would only show
                  an unrecognisable band through the middle of the mark. Painted as a mask over
                  `bg-primary-action` instead of an <img>, so it takes the theme
                  colour rather than the SVG's own blue, and the gradient mask on
                  the wrapper fades it out toward the greeting so text never sits
                  on the mark's busiest part. Decorative — hidden from AT and
                  inert to the pointer. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 [mask-image:linear-gradient(to_right,transparent,black_55%)]"
              >
                <div
                  className="absolute -right-4 top-1/2 size-32 -translate-y-1/2 rotate-[-12deg] bg-primary-action opacity-[0.12] sm:-right-6 sm:size-36 xl:-right-8 xl:size-40"
                  style={{
                    maskImage: "url(/brand/logo-yuanta.svg)",
                    WebkitMaskImage: "url(/brand/logo-yuanta.svg)",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    maskSize: "contain",
                    WebkitMaskSize: "contain",
                    maskPosition: "center",
                    WebkitMaskPosition: "center",
                  }}
                />
              </div>
              <h2 className="type-h5 font-bold text-primary-action">
                Hello, {NOTE_AUTHOR}
              </h2>
              <p className="text-[12.5px] text-primary-action/70">{thaiFullDate(today)}</p>
            </Card>

            <StatTiles tiles={tiles} />

            {/* The one card on this page that asks for something gets the row
                to itself — its rows carry two lines plus a drafted message, and
                sharing the width cost the draft more than a neighbour gained. */}
            <NbaComingSoonCard
              rows={nbaRows}
              message={NBA_MESSAGE_BOOK}
              onDismiss={dismissNba}
            />

            {/* Two halves of "where does the desk stand": what it is holding,
                and what it has been doing. Neither is a to-do, so they share
                a row rather than each taking a full-width turn under the card
                above. Split from `lg`, where the work column is the whole
                page. */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-5">
              <Card variant="default" className="gap-4">
                <CardHeader
                  title="ภาพรวมสินทรัพย์"
                  link={{ href: "/client-hub", label: "ดูทั้งหมด" }}
                />
                <AssetSummaryPanel clients={clients ?? []} />
              </Card>

              <Card variant="default" className="gap-4">
                <CallLogPanel rows={callLog} limit={CALL_LOG_ROW_LIMIT} />
              </Card>
            </div>

          </div>

          {/* Sticky from `xl`, where the two columns actually sit side by side.

              The work column runs much longer than the rail, so left alone the
              rail scrolls away and leaves a tall empty gutter beside it.

              `top`, not `bottom`. A sticky box only ever holds in one
              direction: `bottom` is what keeps a footer or a toolbar on screen
              as you scroll *up*, and on a sidebar it does nothing on the way
              down, which is the only direction that matters here. `top` is what
              holds a column in place while the content beside it keeps going.

              The three rail cards come to less than a viewport between them, so
              pinning the head keeps the whole rail — calendar included — in
              view. An earlier attempt capped the height and gave the rail its
              own scrollbar to guard against the opposite case; that made the
              page two surfaces scrolling against each other and squashed the
              cards into one another, and is not worth re-introducing for a
              rail this size.

              `xl:items-start` on the grid above is what makes this work at all:
              a grid item stretches to the row height by default, and an item as
              tall as its own track has nowhere to stick to. */}
          <aside
            ref={railRef}
            style={{ top: railTop }}
            className="dashboard-rail min-w-0 flex w-full flex-col gap-4 xl:gap-5 xl:col-start-2 xl:row-start-1 row-start-1 xl:sticky"
          >
            {/* Three dated things in one column, today's first. Reminders are
                what the day was planned around; the KYC expiries below are the
                deadlines it has to survive. The month sits under both. */}
            <Card variant="default" className="gap-4">
              <RemindersPanel
                dayItems={dayReminders}
                kycItems={todayKyc}
                clientNames={clientNames}
                onOpen={openDayItem}
              />
            </Card>

            <Card variant="default" className="gap-4">
              <KycAlertsPanel rows={kycRows} inlineDays={KYC_INLINE_DAYS} />
            </Card>

            <Card variant="default" className="gap-4">
              <MiniCalendar
                viewDate={viewDate}
                today={today}
                remindersByDay={monthReminders}
                clientNames={clientNames}
                onOpen={openDayItem}
                onMonthChange={(delta) =>
                  updateQuery({
                    month: monthOffset + delta === 0 ? null : String(monthOffset + delta),
                  })
                }
              />
            </Card>
          </aside>
        </div>
      </div>

      {modals}
    </>
  );
}

/** "วันพฤหัสบดีที่ 24 กันยายน 2569" — Buddhist era, matching the dates House
 *  View and the asset summaries are authored in. */
function thaiFullDate(day: Date): string {
  return day.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Mirrors the shape above, so the page doesn't jump when the data arrives.
 * Bound to `useClientsResource().isLoading`, which is `false` today and starts
 * going `true` the moment that hook is given a real endpoint — see
 * `@/hooks/use-api`.
 */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 xl:gap-5">
      <div className="dashboard-split grid grid-cols-1 gap-4 xl:gap-5">
        <div className="min-w-0 flex flex-col gap-4 xl:gap-5 xl:col-start-1 xl:row-start-1 row-start-2">
          <Skeleton className="h-[76px] rounded-2xl" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[96px] rounded-2xl" />
            ))}
          </div>
          {/* Next Best Actions */}
          <Card variant="default" className="gap-4">
            <Skeleton className="h-7 w-52" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[168px] rounded-xl" />
            ))}
          </Card>
          {/* ภาพรวมสินทรัพย์ | Call Log */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-5">
            <Card variant="default" className="gap-4">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-[116px] w-[116px] mx-auto rounded-full" />
              <Skeleton className="h-[176px] rounded-2xl" />
            </Card>
            <Card variant="default" className="gap-4">
              <Skeleton className="h-7 w-32" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[84px] rounded-2xl" />
              ))}
            </Card>
          </div>
        </div>
        <aside className="dashboard-rail min-w-0 flex w-full flex-col gap-4 xl:gap-5 xl:col-start-2 xl:row-start-1 row-start-1">
          {/* Reminders */}
          <Card variant="default" className="gap-4">
            <Skeleton className="h-7 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[74px] rounded-xl" />
            ))}
          </Card>
          {/* KYC ใกล้หมดอายุ */}
          <Card variant="default" className="gap-4">
            <Skeleton className="h-7 w-44" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[62px] rounded-xl" />
            ))}
          </Card>
          <Card variant="default" className="gap-4">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-[248px] rounded-xl" />
          </Card>
        </aside>
      </div>
    </div>
  );
}
