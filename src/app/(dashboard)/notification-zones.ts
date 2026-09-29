import type { NotificationItem } from "@sarunyu/system-one";

/**
 * The one axis every bell row is placed on: how many days until it is due.
 *
 * Both feeds that reach the bell — reminders and KYC expiries — used to group
 * on axes of their own. Reminders answered "how close is this", KYC answered
 * "when did this alert arrive", and the shell concatenated the two lists. The
 * result read as two apps stapled together, and put "Next 2 weeks" *above*
 * "วันนี้" because the second list simply started after the first had ended.
 *
 * One shared zone fixes the ordering and the vocabulary at the same time: a KYC
 * expiring today and a dividend due today land in the same group, under one
 * Thai heading, sorted by urgency rather than by which hook produced them.
 */
export type NotificationZone =
  | "overdue"
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "next2Weeks";

/** Urgency order — the order the groups are rendered in. */
export const ZONE_ORDER: NotificationZone[] = [
  "overdue",
  "today",
  "tomorrow",
  "thisWeek",
  "next2Weeks",
];

export const ZONE_LABEL_TH: Record<NotificationZone, string> = {
  overdue: "เลยกำหนด",
  today: "วันนี้",
  tomorrow: "พรุ่งนี้",
  thisWeek: "สัปดาห์นี้",
  next2Weeks: "2 สัปดาห์ข้างหน้า",
};

/**
 * Which zone a due-date falls in, or `null` past 15 days — the point nothing
 * has rung its first checkpoint yet and the bell should stay quiet.
 *
 * Overdue and today are each exactly one day; the zones widen further out,
 * since something 15 days away does not need the day-by-day separation that
 * something due tomorrow does.
 */
export function zoneForDays(daysLeft: number): NotificationZone | null {
  if (daysLeft < 0) return "overdue";
  if (daysLeft === 0) return "today";
  if (daysLeft === 1) return "tomorrow";
  if (daysLeft <= 7) return "thisWeek";
  if (daysLeft <= 15) return "next2Weeks";
  return null;
}

/**
 * Whether a zone belongs in the bell's first screen.
 *
 * The split the whole panel is built on: *already due* on open, everything
 * still ahead behind one row. Tomorrow sits on the far side deliberately —
 * "หน้าแรกคือสิ่งที่ถึงกำหนดแล้ว" is a rule that survives being explained,
 * where "today plus tomorrow, but not the day after" is not.
 */
export function isDue(zone: NotificationZone): boolean {
  return zone === "overdue" || zone === "today";
}

/** A row plus the zone it was placed in, before the shell groups them. */
export type ZonedNotification = {
  zone: NotificationZone;
  /** Days until due — sorts rows within a zone, most urgent first. */
  daysLeft: number;
  item: NotificationItem;
};

/**
 * The heading over a day's rows in the bell: the day itself, counted back from
 * today. Thai reads these as words for the first two and a count after that —
 * "วันนี้", "เมื่อวาน", "2 วันก่อน" — the way a chat list dates its messages.
 *
 * `daysAgo` is `-daysLeft`, so 0 is today and 1 is yesterday.
 */
export function daysAgoLabelTh(daysAgo: number): string {
  if (daysAgo <= 0) return "วันนี้";
  if (daysAgo === 1) return "เมื่อวาน";
  return `${daysAgo} วันก่อน`;
}
