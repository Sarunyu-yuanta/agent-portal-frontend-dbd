"use client";

/**
 * How a risk finding is drawn: the words, the glyph and the tints.
 *
 * Apart from `risk-feed`, which ranks and counts, for the split
 * `compliance/AlertCards` and `ai-insights/insight-config` already make — the
 * data layer exports the unions and the ordering, never the colours.
 */

import type { ElementType } from "react";
import {
  ChartLineDownIcon,
  EyeIcon,
  InfoIcon,
  ShieldWarningIcon,
  UserFocusIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import type { RiskAlertCategory, RiskSeverity } from "@/types/domain";

/** Where "ดูทั้งหมด" lands. Exported from here rather than from the panel the
 *  way `CALL_LOG_PAGE` is: the sub page needs the string, and importing it out
 *  of the card component would pull the whole panel into the page's graph. */
export const RISK_ALERTS_PAGE = "/command-center/risk-alerts";

/** Worst first — the order the strip and the chip row are drawn in. */
export const SEVERITY_ORDER: RiskSeverity[] = ["critical", "warning", "watch"];

/** The order of the category tabs. */
export const RISK_CATEGORY_ORDER: RiskAlertCategory[] = [
  "margin",
  "aml",
  "suitability",
  "conduct",
];

/**
 * How bad, as everything that draws it.
 *
 * `variant` is `Tag`'s; `pill` is a `RowIcon` tone (background plus text off
 * the `--fill-*` ramp, the shape `StatTiles`' `TONE` and `kycCheckpointTone`
 * already use); `text` colours an inline countdown; `dot` is the strip's bullet;
 * `bar` is the full-width deadline band in the detail panel.
 */
export const RISK_SEVERITY_META: Record<
  RiskSeverity,
  {
    label: string;
    variant: "red" | "yellow" | "blue";
    pill: string;
    text: string;
    dot: string;
    bar: string;
    Icon: ElementType;
  }
> = {
  critical: {
    label: "วิกฤต",
    variant: "red",
    pill: "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]",
    text: "text-[var(--fill-red-600)]",
    dot: "bg-[var(--fill-red-500)]",
    bar: "bg-[var(--bg-danger-light)] text-[var(--text-danger-primary)]",
    Icon: XCircleIcon,
  },
  warning: {
    label: "เฝ้าระวัง",
    variant: "yellow",
    pill: "bg-[var(--fill-amber-100)] text-[var(--fill-amber-600)]",
    text: "text-[var(--fill-amber-600)]",
    dot: "bg-[var(--fill-amber-500)]",
    bar: "bg-[var(--bg-warning-light)] text-[var(--text-warning-primary)]",
    Icon: WarningCircleIcon,
  },
  watch: {
    label: "ข้อสังเกต",
    variant: "blue",
    pill: "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]",
    text: "text-[var(--fill-p1-600)]",
    dot: "bg-[var(--fill-p1-500)]",
    bar: "bg-primary-action-light text-primary-action",
    Icon: InfoIcon,
  },
};

/**
 * Which rule family raised it.
 *
 * `tone` is **not** used on a row's `RowIcon`. That square carries the
 * *severity* tint, because in a triage list the loudest mark on the row should
 * say how bad a thing is, and three tints beat four for a glance. The family is
 * carried on the row by the glyph's shape and by the word in the second line.
 * `tone` is for the detail panel's header square, where a full severity `Tag`
 * sits an inch below and the hue is free to mean the other thing.
 *
 * No family is red. With severity on the square, an AML-critical row would
 * otherwise show a red square beside a red pill and an AML-watch row a red
 * square beside a blue one — one hue meaning two things on one row. Reserving
 * red for severity alone is what makes the strip and the squares legible
 * together.
 */
export const RISK_CATEGORY_META: Record<
  RiskAlertCategory,
  { label: string; Icon: ElementType; tone: string }
> = {
  margin: {
    label: "มาร์จิ้น/วงเงิน",
    Icon: ChartLineDownIcon,
    tone: "bg-[var(--fill-orange-100)] text-[var(--fill-orange-600)]",
  },
  aml: {
    label: "AML/บัญชีม้า",
    Icon: ShieldWarningIcon,
    tone: "bg-[var(--fill-violet-100)] text-[var(--fill-violet-600)]",
  },
  suitability: {
    label: "ความเหมาะสมการลงทุน",
    Icon: UserFocusIcon,
    tone: "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]",
  },
  conduct: {
    label: "พฤติกรรมการซื้อขาย",
    Icon: EyeIcon,
    tone: "bg-[var(--fill-amber-100)] text-[var(--fill-amber-600)]",
  },
};

/**
 * The deadline, as a signed phrase.
 *
 * Same three cases as `KycAlertsPanel`'s `countdownLabel`, because "เลยกำหนด"
 * and "ต้องดำเนินการใน" are opposite situations and a bare number is neither.
 * Worded for an obligation rather than an expiry: a margin call is something to
 * *do*, where a KYC record is something that lapses.
 */
export function deadlineLabel(daysLeft: number): string {
  if (daysLeft === 0) return "ครบกำหนดวันนี้";
  if (daysLeft < 0) return `เลยกำหนดมา ${Math.abs(daysLeft)} วัน`;
  return `ต้องดำเนินการใน ${daysLeft} วัน`;
}

/**
 * How long ago the rule fired — "3 ชม. ที่แล้ว", "เมื่อวาน", "5 วันก่อน".
 *
 * What a row wants, where {@link detectedAtLabel} is what the record wants.
 * Reading a list, the question is *how stale is this*, and a clock time makes
 * the reader do the subtraction on every row; an elapsed figure has already
 * done it. The exact stamp is one click away in the detail panel, and sits on
 * the row's `title` for a hover.
 *
 * Hours rather than only days, which is as fine as `relativeCallDate` and
 * `daysAgoLabelTh` go. A call log is a history where the day is the unit; these
 * fire through the trading session, and "2 ชม." versus "8 ชม." is the
 * difference between this morning's problem and yesterday's.
 */
export function detectedAgoLabel(detectedAt: string, now: Date): string {
  const at = new Date(detectedAt);

  /**
   * Hours are only ever counted **within today**; the moment a finding is on an
   * earlier calendar day it is named by the day.
   *
   * A pure elapsed count reads wrong in a list. Yesterday 16:45 came out as "23
   * ชม. ที่แล้ว" while yesterday 08:05 — one row below it — came out as
   * "เมื่อวาน": two findings from the same afternoon described two different
   * ways, and the reader has to do arithmetic to notice they belong together.
   * The calendar boundary is also what a desk actually says, and what
   * `daysAgoLabelTh` already uses for the bell.
   */
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThatDay = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  const daysAgo = Math.round(
    (startOfToday.getTime() - startOfThatDay.getTime()) / 86_400_000,
  );

  if (daysAgo <= 0) {
    const minutes = Math.max(0, Math.floor((now.getTime() - at.getTime()) / 60_000));
    if (minutes < 1) return "เมื่อสักครู่";
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    return `${Math.floor(minutes / 60)} ชม. ที่แล้ว`;
  }
  if (daysAgo === 1) return "เมื่อวาน";
  if (daysAgo < 7) return `${daysAgo} วันก่อน`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} สัปดาห์ก่อน`;
  return `${Math.floor(daysAgo / 30)} เดือนก่อน`;
}

/**
 * When the rule fired, as a stamp — "วันนี้ 09:12 น.", "20 ต.ค. 16:45 น.".
 *
 * The detail panel's line, beside the rule code: a compliance finding is a
 * record, and a record says when, not how long ago. Past two days the date is
 * the clearer answer, the same cut `daysAgoLabelTh` makes for the bell.
 */
export function detectedAtLabel(detectedAt: string, now: Date): string {
  const at = new Date(detectedAt);
  const time = at.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  const daysAgo = Math.round((today.getTime() - day.getTime()) / 86_400_000);

  if (daysAgo <= 0) return `วันนี้ ${time} น.`;
  if (daysAgo === 1) return `เมื่อวาน ${time} น.`;
  const date = at.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  return `${date} ${time} น.`;
}
