"use client";

/**
 * Everything the Promotions surfaces derive rather than store.
 *
 * Kept out of the components for the reason `dashboard-data` is: a campaign's
 * status, its countdown and its eligible-client count are each read by more
 * than one surface — the card, the KPI strip, the right rail's "ใกล้หมดเขต"
 * list, the detail header — and two of them disagreeing is exactly the class of
 * bug this file exists to make unauthorable. The card's "เหลือ 3 วัน" and the
 * rail's ordering come from one function.
 *
 * Nothing here reaches into state. These take the campaign (and, where
 * relevant, the clients or the store's rows) and return a derivation, so they
 * stay testable and the components stay about layout.
 */

import { segmentsOfClient } from "@/lib/campaign-mock-data";
import type {
  Campaign,
  CampaignClient,
  CampaignClientStatus,
  CampaignFormat,
  CampaignProduct,
  CampaignRsvp,
  CampaignStatus,
  CampaignType,
  Client,
  ClientSegment,
  RsvpStatus,
} from "@/types/domain";

// ── Dates and status ────────────────────────────────────────────────────────

/**
 * An ISO day (`2026-10-12`) as a local midnight `Date`.
 *
 * Deliberately **not** `dayFromKey` from `calendar-grid`, which looks like it
 * would do: that one reads the month the way `dayKey` writes it — zero-based,
 * straight off `getMonth()` — so feeding it an ISO day puts every campaign a
 * month early. Its own doc warns about the mirror image of this mistake. The
 * two string formats are not interchangeable, so keep them apart.
 *
 * Also not `new Date(iso)`, which parses as UTC and lands a Bangkok morning on
 * the day before.
 */
export function dayFromIso(isoDay: string): Date {
  const [year, month, day] = isoDay.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Whole days from today to an ISO day. Negative once the day is past. */
export function daysUntil(isoDay: string, today: Date): number {
  const target = dayFromIso(isoDay);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Where a campaign stands today.
 *
 * The window is inclusive at both ends: a campaign ending today is still one
 * the IC can act on this afternoon, and calling it "หมดเขต" at midnight of its
 * own last day would be wrong by a working day.
 */
export function campaignStatus(campaign: Campaign, today: Date): CampaignStatus {
  if (daysUntil(campaign.startDate, today) > 0) return "upcoming";
  if (daysUntil(campaign.endDate, today) < 0) return "ended";
  return "active";
}

/** Days left to act. Negative for an ended campaign, so callers can clamp. */
export function daysLeft(campaign: Campaign, today: Date): number {
  return daysUntil(campaign.endDate, today);
}

/** The threshold the countdown badge and the "ใกล้หมดเขต" rail both use. */
export const ENDING_SOON_DAYS = 7;

/** Active, and inside {@link ENDING_SOON_DAYS} of closing. */
export function isEndingSoon(campaign: Campaign, today: Date): boolean {
  const left = daysLeft(campaign, today);
  return (
    campaignStatus(campaign, today) === "active" &&
    left >= 0 &&
    left <= ENDING_SOON_DAYS
  );
}

/** An event already held — the only state in which attendance can be marked. */
export function isPastEvent(campaign: Campaign, today: Date): boolean {
  return (
    campaign.type === "event" &&
    campaign.eventDate !== undefined &&
    daysUntil(campaign.eventDate, today) < 0
  );
}

/** Whether an event's date falls in the same calendar month as `today`. */
export function isEventThisMonth(campaign: Campaign, today: Date): boolean {
  if (campaign.type !== "event" || !campaign.eventDate) return false;
  const date = dayFromIso(campaign.eventDate);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  );
}

// ── Eligibility ─────────────────────────────────────────────────────────────

/**
 * The clients a campaign is for, before anyone is excluded by hand.
 *
 * The segment match is the firm's rule; the per-client rows in the store can
 * still override it to ineligible with a reason (see {@link CampaignClient}).
 * Use {@link eligibleClientIds} when what you want is "who can actually be
 * sent this", which is almost always.
 */
export function matchesSegments(campaign: Campaign, client: Client): boolean {
  return segmentsOfClient(client).some((s) => campaign.segments.includes(s));
}

/** Who can actually be sent this campaign, after the stored overrides. */
export function eligibleClientIds(
  campaign: Campaign,
  rows: CampaignClient[],
): Set<string> {
  return new Set(
    rows
      .filter((row) => row.campaignId === campaign.id && row.eligible)
      .map((row) => row.clientId),
  );
}

/** Eligible, and nothing has gone out to them yet — the "ยังไม่ได้ชวน" count. */
export function notYetInvitedCount(
  campaign: Campaign,
  rows: CampaignClient[],
): number {
  return rows.filter(
    (row) =>
      row.campaignId === campaign.id &&
      row.eligible &&
      row.status === "not-sent",
  ).length;
}

/**
 * One row per client the campaign concerns, joined to the client record and
 * ordered so the IC's remaining work is at the top.
 *
 * Ineligible rows stay in the list rather than being filtered out: the spec's
 * disabled-row-plus-reason is the point — an IC who can't see why a client is
 * missing will ask, and the answer belongs on screen.
 */
export type CampaignClientRow = {
  client: Client;
  eligible: boolean;
  ineligibleReason?: string;
  status: CampaignClientStatus;
  updatedAt: string;
  /** Present only on events. */
  rsvp?: RsvpStatus;
};

/** Eligible-and-untouched first, then the rest of the eligible, then blocked. */
const STATUS_ORDER: Record<CampaignClientStatus, number> = {
  "not-sent": 0,
  sent: 1,
  interested: 2,
  redeemed: 3,
};

export function campaignClientRows(
  campaign: Campaign,
  rows: CampaignClient[],
  rsvps: CampaignRsvp[],
  clients: Client[],
): CampaignClientRow[] {
  const byId = new Map(clients.map((c) => [c.id, c]));
  const rsvpById = new Map(
    rsvps
      .filter((r) => r.campaignId === campaign.id)
      .map((r) => [r.clientId, r.status]),
  );

  return rows
    .filter((row) => row.campaignId === campaign.id)
    .flatMap((row) => {
      const client = byId.get(row.clientId);
      if (!client) return [];
      return [
        {
          client,
          eligible: row.eligible,
          ineligibleReason: row.ineligibleReason,
          status: row.status,
          updatedAt: row.updatedAt,
          rsvp: rsvpById.get(row.clientId),
        },
      ];
    })
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (byStatus !== 0) return byStatus;
      return a.client.name.localeCompare(b.client.name);
    });
}

// ── Filtering and ordering the list ─────────────────────────────────────────

export type CampaignTab = "all" | "promotion" | "event";

export type CampaignFilters = {
  product: CampaignProduct | null;
  status: CampaignStatus | null;
  segment: ClientSegment | null;
  format: CampaignFormat | null;
  search: string;
};

export function hasActiveFilters(filters: CampaignFilters): boolean {
  return (
    filters.product !== null ||
    filters.status !== null ||
    filters.segment !== null ||
    filters.format !== null ||
    filters.search.trim() !== ""
  );
}

/** Every tab but "all" names a campaign type, so the id *is* the filter. */
function matchesTab(campaign: Campaign, tab: CampaignTab): boolean {
  return tab === "all" || campaign.type === (tab as CampaignType);
}

export function filterCampaigns(
  campaigns: Campaign[],
  {
    tab,
    filters,
    today,
  }: {
    tab: CampaignTab;
    filters: CampaignFilters;
    today: Date;
  },
): Campaign[] {
  const needle = filters.search.trim().toLowerCase();
  return campaigns.filter((campaign) => {
    if (!matchesTab(campaign, tab)) return false;
    if (filters.product && !campaign.products.includes(filters.product)) {
      return false;
    }
    if (filters.status && campaignStatus(campaign, today) !== filters.status) {
      return false;
    }
    if (filters.segment && !campaign.segments.includes(filters.segment)) {
      return false;
    }
    // A promotion has no format, so filtering by one excludes every promotion
    // rather than letting them through on a field they don't have.
    if (filters.format && campaign.format !== filters.format) return false;
    if (needle) {
      const haystack = `${campaign.title} ${campaign.summary}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

/**
 * Default order: ending soonest first.
 *
 * Ended campaigns sink to the bottom whatever their dates say — they are
 * reference, not work — and within each group the nearer deadline leads. An
 * upcoming campaign sorts by when it *closes* like everything else, so the
 * question the order answers stays "what runs out first".
 */
export function sortByEndingSoonest(
  campaigns: Campaign[],
  today: Date,
): Campaign[] {
  return [...campaigns].sort((a, b) => {
    const aEnded = campaignStatus(a, today) === "ended";
    const bEnded = campaignStatus(b, today) === "ended";
    if (aEnded !== bEnded) return aEnded ? 1 : -1;
    const byDate = a.endDate.localeCompare(b.endDate);
    if (byDate !== 0) return byDate;
    return a.title.localeCompare(b.title);
  });
}

// ── Labels ──────────────────────────────────────────────────────────────────

export const PRODUCT_LABEL: Record<CampaignProduct, string> = {
  stock: "หุ้น",
  "mutual-fund": "กองทุน",
  global: "Global",
  fcn: "FCN",
  bond: "Bond",
};

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  upcoming: "เร็ว ๆ นี้",
  active: "กำลังดำเนินการ",
  ended: "หมดเขต",
};

export const SEGMENT_LABEL: Record<ClientSegment, string> = {
  uhnw: "UHNW",
  hnw: "HNW",
  aggressive: "รับความเสี่ยงสูง",
  moderate: "รับความเสี่ยงปานกลาง",
  conservative: "รับความเสี่ยงต่ำ",
  "idle-cash": "มีเงินสดคงค้าง",
};

export const FORMAT_LABEL: Record<CampaignFormat, string> = {
  online: "Online",
  onsite: "Onsite",
};

export const TYPE_LABEL: Record<CampaignType, string> = {
  promotion: "โปรโมชัน",
  event: "สัมมนา/อีเว้นท์",
};

export const CLIENT_STATUS_LABEL: Record<CampaignClientStatus, string> = {
  "not-sent": "ยังไม่ส่ง",
  sent: "ส่งแล้ว",
  interested: "สนใจ",
  redeemed: "ใช้สิทธิ์แล้ว",
};

export const RSVP_LABEL: Record<RsvpStatus, string> = {
  registered: "ลงทะเบียน",
  confirmed: "ยืนยัน",
  attended: "เข้าร่วม",
  "no-show": "ไม่มา",
};

/** "12 ต.ค. 2569" — Buddhist era, matching every other date in the app. */
export function thaiDay(isoDay: string): string {
  return dayFromIso(isoDay).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * The one date line a card shows.
 *
 * An event is defined by the day it happens; a promotion by the window it is
 * open. Printing both for an event would put the registration deadline next to
 * the event date with nothing to tell them apart.
 */
export function campaignDateLine(campaign: Campaign): string {
  if (campaign.type === "event" && campaign.eventDate) {
    return thaiDay(campaign.eventDate);
  }
  return `${thaiDay(campaign.startDate)} – ${thaiDay(campaign.endDate)}`;
}

/** "เหลือ 3 วัน" / "วันสุดท้าย" — only meaningful while a campaign is open. */
export function countdownLabel(campaign: Campaign, today: Date): string | null {
  if (!isEndingSoon(campaign, today)) return null;
  const left = daysLeft(campaign, today);
  return left === 0 ? "วันสุดท้าย" : `เหลือ ${left} วัน`;
}
