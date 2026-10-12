"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { TabGroup } from "@sarunyu/system-one";
import { MegaphoneIcon } from "@phosphor-icons/react";
import { FadeIn } from "@/components/ui/fade-in";
import { EmptyState } from "@/components/ui/empty-state";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useCampaignStore } from "@/contexts/campaigns-context";
import { useScrollTopOnChange } from "@/hooks/use-scroll-top";
import { setQueryState, withQuery } from "@/lib/query-state";
import { todayDateKey } from "../calendar/calendar-grid";
import {
  CampaignSummaryBar,
  type CampaignSummaryStat,
} from "./CampaignSummaryBar";
import { CampaignCard } from "./CampaignCard";
import { CampaignFilters, type DropdownFilters } from "./CampaignFilters";
import { FeaturedCarousel } from "./FeaturedCarousel";
import { PromotionsSkeleton } from "./PromotionsSkeleton";
import { PROMOTIONS_GRID_CSS } from "./promotions-grid-css";
import {
  campaignStatus,
  filterCampaigns,
  isEventThisMonth,
  notYetInvitedCount,
  hasActiveFilters,
  sortByEndingSoonest,
  type CampaignFilters as Filters,
  type CampaignTab,
} from "./campaign-data";
import type { CampaignFormat, CampaignProduct, ClientSegment } from "@/types/domain";

/**
 * Promotions & Events — what the firm is running, and who of this IC's clients
 * it is for.
 *
 * The page answers two questions, in order: what is being pushed right now (the
 * hero, with the counts welded under it) and what else is running (the grid).
 * One column, full width — there is no side rail, and nothing is filed off to
 * the edge of the screen.
 *
 * Deadlines used to live in a rail here. They are not lost: the grid is sorted
 * ending-soonest-first by default, and anything inside a week carries its own
 * "เหลือ N วัน" badge on the card, so the same information arrives in the place
 * the IC is already looking.
 *
 * Every campaign's status, countdown and eligible count is derived in
 * `campaign-data` rather than here; see that module for why.
 *
 * ## View state
 *
 * Tab, filters and the calendar's month all live in the query string, per the
 * app's convention: the tab is `push`ed (it is a destination the back button
 * should walk out of) and the refinements are `replace`d (they would otherwise
 * pile up history entries the IC has to click through to leave the page). That
 * also makes a filtered list a shareable link, which a promotions desk asks for
 * more than most.
 */
export default function PromotionsPage() {
  return (
    <Suspense fallback={<PromotionsSkeleton />}>
      <PromotionsPageInner />
    </Suspense>
  );
}

const PATH = "/promotions";

/** Up to three hero slides — more and it stops being a shortlist. */
const FEATURED_LIMIT = 3;

const TABS: { id: CampaignTab; title: string }[] = [
  { id: "all", title: "ทั้งหมด" },
  { id: "promotion", title: "โปรโมชัน" },
  { id: "event", title: "สัมมนา/อีเว้นท์" },
];

function normalizeTab(value: string | null): CampaignTab {
  return TABS.some((t) => t.id === value) ? (value as CampaignTab) : "all";
}

function PromotionsPageInner() {
  const searchParams = useSearchParams();
  const { data: campaigns, isLoading } = useCampaigns();
  const { campaignClients, rsvps, seatsLeft } = useCampaignStore();

  // Anchored to the calendar day rather than a fresh `Date`, so the memos below
  // don't recompute on every render — same as the Dashboard.
  const todayKey = todayDateKey();
  const today = useMemo(() => new Date(todayKey), [todayKey]);

  const tab = normalizeTab(searchParams.get("tab"));

  const filters: Filters = useMemo(
    () => ({
      product: (searchParams.get("product") as CampaignProduct | null) ?? null,
      status: (searchParams.get("status") as Filters["status"]) ?? null,
      segment: (searchParams.get("segment") as ClientSegment | null) ?? null,
      format: (searchParams.get("format") as CampaignFormat | null) ?? null,
      search: searchParams.get("q") ?? "",
    }),
    [searchParams],
  );

  const updateQuery = useCallback(
    (updates: Record<string, string | null>, mode: "push" | "replace" = "replace") =>
      setQueryState(withQuery(PATH, searchParams, updates), mode),
    [searchParams],
  );

  const setFilters = useCallback(
    (next: Partial<Filters>) =>
      updateQuery({
        ...("product" in next ? { product: next.product ?? null } : {}),
        ...("status" in next ? { status: next.status ?? null } : {}),
        ...("segment" in next ? { segment: next.segment ?? null } : {}),
        ...("format" in next ? { format: next.format ?? null } : {}),
        // An empty search is the absence of one, not a `?q=` with nothing in it.
        ...("search" in next ? { q: next.search?.trim() ? next.search : null } : {}),
      }),
    [updateQuery],
  );

  const clearFilters = useCallback(
    () => updateQuery({ product: null, status: null, segment: null, format: null, q: null }),
    [updateQuery],
  );

  // ── Derivations ───────────────────────────────────────────────────────────

  const live = useMemo(
    () => campaigns.filter((c) => campaignStatus(c, today) !== "ended"),
    [campaigns, today],
  );

  const stats: CampaignSummaryStat[] = useMemo(() => {
    const usable = campaigns.filter((c) => campaignStatus(c, today) === "active");
    const eventsThisMonth = campaigns.filter((c) => isEventThisMonth(c, today));
    // Distinct *people*, not seats: a client booked onto three seminars is one
    // client the IC has got through to, and three would flatter the number.
    // Scoped to events still ahead — attendance at a seminar held last month is
    // history, and the tile beside it is already counting this month's events.
    const registered = new Set(
      rsvps
        .filter((row) => live.some((c) => c.id === row.campaignId))
        .map((row) => row.clientId),
    );
    // Live campaigns only, for the same reason: a client nobody invited to a
    // campaign that has already closed is not work left to do.
    const notInvited = live.reduce(
      (sum, c) => sum + notYetInvitedCount(c, campaignClients),
      0,
    );

    return [
      { id: "usable", label: "โปรที่ใช้ได้", value: usable.length },
      { id: "events", label: "อีเว้นท์เดือนนี้", value: eventsThisMonth.length },
      { id: "registered", label: "ลูกค้าที่ลงทะเบียน", value: registered.size },
      {
        id: "not-invited",
        label: "เข้าเงื่อนไขแต่ยังไม่ได้ชวน",
        value: notInvited,
        // The one number on this page that is work rather than context.
        accent: true,
      },
    ];
  }, [campaigns, campaignClients, rsvps, live, today]);

  const featured = useMemo(
    () =>
      sortByEndingSoonest(
        campaigns.filter(
          (c) => c.featured && campaignStatus(c, today) !== "ended",
        ),
        today,
      ).slice(0, FEATURED_LIMIT),
    [campaigns, today],
  );

  const visible = useMemo(
    () =>
      sortByEndingSoonest(filterCampaigns(campaigns, { tab, filters, today }), today),
    [campaigns, tab, filters, today],
  );

  /**
   * How many campaigns a draft set of filters would leave.
   *
   * The dialog covers the list, so this is the only way for an IC to tell they
   * are about to narrow it to nothing. Measured against the tab and the search
   * box as they stand — those are not part of the draft, and a count that
   * ignored them would promise results the list won't show.
   */
  const previewCount = useCallback(
    (draft: DropdownFilters) =>
      filterCampaigns(campaigns, {
        tab,
        filters: { ...draft, search: filters.search },
        today,
      }).length,
    [campaigns, tab, filters.search, today],
  );

  // Arriving from a campaign detail via the breadcrumb otherwise inherits that
  // page's scroll offset and opens partway down.
  useScrollTopOnChange([]);

  if (isLoading) return <PromotionsSkeleton />;

  return (
    <>
      <style>{PROMOTIONS_GRID_CSS}</style>
      <div className="flex flex-col gap-4 xl:gap-5">
        {/* The hero block: featured artwork, with the counts welded underneath
            as its base. One surface rounds and clips both — see
            `CampaignSummaryBar` for why the counts live here rather than in a
            row of tiles above. With nothing featured the ribbon stands alone
            and simply rounds on all four corners. */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {featured.length > 0 && (
            <FeaturedCarousel campaigns={featured} today={today} />
          )}
          <CampaignSummaryBar stats={stats} welded={featured.length > 0} />
        </div>

        <div className="transparent-tabs scrollable-tabs -mx-4 pl-4 xl:-mx-6 xl:pl-6">
          <TabGroup
            items={TABS.map((t) => ({ id: t.id, title: t.title }))}
            activeId={tab}
            // `push`: a tab is a destination, and the back button should walk
            // out of it rather than off the page.
            onChange={(id) => updateQuery({ tab: id === "all" ? null : id }, "push")}
            size="md"
          />
        </div>

        <CampaignFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          previewCount={previewCount}
        />

        <FadeIn key={`${tab}-${visible.length}`}>
          {visible.length === 0 ? (
            <EmptyState
              icon={
                <MegaphoneIcon
                  size={40}
                  className="text-[var(--text-default-placeholder)]"
                />
              }
              title={emptyTitle(tab, filters)}
              body={emptyBody(tab, filters)}
              action={
                hasActiveFilters(filters)
                  ? { label: "ล้างตัวกรอง", onClick: clearFilters }
                  : undefined
              }
            />
          ) : (
            <div className="promotions-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
              {visible.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  seatsLeft={seatsLeft(campaign.id)}
                />
              ))}
            </div>
          )}
        </FadeIn>
      </div>
    </>
  );
}

function emptyTitle(tab: CampaignTab, filters: Filters): string {
  if (hasActiveFilters(filters)) return "ไม่พบแคมเปญที่ค้นหา";
  if (tab === "promotion") return "ยังไม่มีโปรโมชัน";
  if (tab === "event") return "ยังไม่มีสัมมนา/อีเว้นท์";
  return "ยังไม่มีแคมเปญ";
}

function emptyBody(_tab: CampaignTab, filters: Filters): string {
  if (hasActiveFilters(filters)) {
    return "ลองค้นหาด้วยคำอื่น หรือล้างตัวกรองเพื่อดูแคมเปญทั้งหมด";
  }
  return "เมื่อมีแคมเปญใหม่จากส่วนกลาง จะแสดงที่นี่";
}
