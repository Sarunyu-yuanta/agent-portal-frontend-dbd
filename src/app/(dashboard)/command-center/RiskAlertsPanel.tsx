"use client";

import { useState } from "react";
import Link from "next/link";
import { Chip, Tag } from "@sarunyu/system-one";
import { CaretRightIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { withQuery } from "@/lib/query-state";
import type { RiskAlert, RiskSeverity } from "@/types/domain";
import { CardHeader, RowIcon } from "./CardHeader";
import { RiskAlertDetail } from "./RiskAlertDetail";
import {
  deadlineLabel,
  detectedAgoLabel,
  detectedAtLabel,
  RISK_ALERTS_PAGE,
  RISK_CATEGORY_META,
  RISK_SEVERITY_META,
  SEVERITY_ORDER,
} from "./risk-config";
import {
  countRiskBySeverity,
  inlineRiskAlerts,
  type RiskAlertRow,
} from "./risk-feed";

/** The name this feature goes by, shared so the card heading and the sub page
 *  cannot drift apart. */
export const RISK_ALERTS_TITLE = "Proactive Compliance Alerts";

/**
 * The way out to the full list.
 *
 * Shown whenever the page has anything to show, not only when the card has been
 * cut short — which is where `CallLogPanel` draws the line. The difference is
 * that this page is also the archive of what has been acknowledged, and the
 * only place either filter exists, so it is worth reaching with three alerts on
 * screen and nothing hidden.
 */
const SEE_ALL = { href: RISK_ALERTS_PAGE, label: "ดูทั้งหมด" };

/**
 * What the book is exposed to right now: margin, AML, suitability and market
 * conduct, in one ranked list.
 *
 * Distinct from the rail's `KycAlertsPanel` on purpose. That card answers
 * "whose paperwork lapses soon" — one subject, one deadline, one shape. This
 * answers "what could go wrong today", across four unrelated rule families, and
 * the findings it carries are things a desk acts on rather than files. No row
 * here is a KYC expiry; `RiskAlertKind` has no member for one, which is what
 * keeps the page from showing the same client twice for two reasons that are
 * really one.
 *
 * Full width in the work column and above the Next Best Actions card: an
 * obligation outranks a suggestion at eight in the morning, and that suggestion
 * card is still held behind a blur — a live, actionable list buried under a
 * placeholder reads as the page hiding its working half.
 *
 * The heading goes through `CardHeader` rather than a local copy of it, so this
 * card opens on the same line — and at the same size — as the Next Best Actions
 * and ภาพรวมสินทรัพย์ cards beside it. A private copy had drifted to `type-h6`
 * and rendered 18px against their 16px.
 */
export function RiskAlertsPanel({
  rows,
  floor,
  acknowledgedCount,
  onAcknowledge,
  severity,
  onSeverityChange,
}: {
  /** Pre-ranked by `buildRiskAlertRows` — the cut below depends on it. */
  rows: RiskAlertRow[];
  floor: number;
  /** Whether the card can still reach the page when nothing has been cut. */
  acknowledgedCount: number;
  onAcknowledge: (alert: RiskAlert) => void;
  /** `null` is "ทั้งหมด". Held in the page's query string, not in this
   *  component, for the reason `query-state` gives: the dashboard layout never
   *  remounts, so a narrowed card survives a trip to a client and back. */
  severity: RiskSeverity | null;
  onSeverityChange: (next: RiskSeverity | null) => void;
}) {
  /** The finding whose panel is open. A row opens the alert, not the client —
   *  the row is clipped to a line, and what you wanted when you clicked was the
   *  rest of it plus the figures behind it. The client is a button further on. */
  const [detail, setDetail] = useState<RiskAlertRow | null>(null);

  /** The link out carries the filter, so the page opens on the view the reader
   *  was already looking at rather than resetting it. */
  const seeAll = {
    href: severity
      ? withQuery(RISK_ALERTS_PAGE, "", { severity })
      : RISK_ALERTS_PAGE,
    label: "ดูทั้งหมด",
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <CardHeader
          title={RISK_ALERTS_TITLE}
          /* Nothing open, but the page still holds whatever has been
             acknowledged — worth reaching only when there is something there. */
          link={acknowledgedCount > 0 ? SEE_ALL : undefined}
        />
        <EmptyState
          icon={
            <ShieldCheckIcon
              size={40}
              weight="duotone"
              className="text-[var(--text-default-placeholder)]"
            />
          }
          title="ไม่มีรายการความเสี่ยงค้างอยู่"
          body="ระบบจะแจ้งเตือนทันทีเมื่อพบความเสี่ยงด้านมาร์จิ้น บัญชีม้า ความเหมาะสมของการลงทุน หรือพฤติกรรมการซื้อขาย"
        />
      </div>
    );
  }

  /** Counted off the *whole* list, never the filtered one: a chip has to keep
   *  saying how many there are of a severity you are not currently looking at,
   *  or picking one would blank out the other three. */
  const counts = countRiskBySeverity(rows);
  const visible = severity
    ? rows.filter((row) => row.alert.severity === severity)
    : rows;
  const { shown, hiddenCount } = inlineRiskAlerts(visible, floor);

  return (
    <div className="flex flex-col gap-4">
      {/* No count beside the title. The strip directly under it already opens
          with "ทั้งหมด N" and then breaks that N down by severity, so a badge
          on the heading was the same figure stated twice, an inch apart — and
          the one that said less of the two, since it could only give a total
          where the strip gives the total *and* what it is made of. */}
      <CardHeader title={RISK_ALERTS_TITLE} link={seeAll} />

      <RiskSeverityStrip
        counts={counts}
        total={rows.length}
        value={severity}
        onChange={onSeverityChange}
      />

      {visible.length === 0 ? (
        /* Only reachable by acknowledging every finding at one severity, which
           is a result worth stating rather than showing an empty box. */
        <EmptyState
          icon={
            <ShieldCheckIcon
              size={40}
              weight="duotone"
              className="text-[var(--text-default-placeholder)]"
            />
          }
          title="ไม่มีรายการในระดับนี้"
          body="เลือก “ทั้งหมด” เพื่อดูรายการความเสี่ยงระดับอื่น"
        />
      ) : (
        /* One surface with rules inside it, matching the Call Log and KYC
           cards: the fill and the radius belong to the list, a row only
           hovers. */
        <div className="overflow-hidden rounded-2xl bg-[var(--bg-default-secondary)] divide-y divide-black/[0.05]">
          {shown.map((row) => (
            <RiskAlertRowItem
              key={row.alert.id}
              row={row}
              onOpen={() => setDetail(row)}
            />
          ))}
          {hiddenCount > 0 && (
            <MoreRow count={hiddenCount} href={seeAll.href} severity={severity} />
          )}
        </div>
      )}

      <RiskAlertDetail
        row={detail}
        onClose={() => setDetail(null)}
        onAcknowledge={(alert) => {
          setDetail(null);
          onAcknowledge(alert);
        }}
      />
    </div>
  );
}

/**
 * How many of each severity are open, as a row of clickable counts.
 *
 * Earns its place because the list below it is cut: without this the card can
 * say "there are eleven" and not "two of them are critical", which is the only
 * part of the eleven that changes what happens next. Each count links into the
 * page pre-filtered to that severity, so the strip is a way in rather than a
 * read-out — and being `<Link>`s they keep ⌘-click, the reason
 * `CARD_LINK_CLASS` exists at all.
 *
 * `flex flex-wrap`, never `grid grid-cols-1 sm:grid-cols-3`: `system-one` ships
 * an unlayered `.grid-cols-1` that wins the source-order tie against a
 * responsive Tailwind `grid-cols-*`, which is the whole reason the Command
 * Center injects `DASHBOARD_RAIL_CSS`. Flex has nothing to collide with.
 *
 * Design-system `Chip`s rather than a grid of bordered count-boxes: this card
 * sits one row under `StatTiles`, and three bordered boxes directly below
 * three bordered tiles read as one six-tile block.
 */
export function RiskSeverityStrip({
  counts,
  total,
  value,
  onChange,
}: {
  counts: Record<RiskSeverity, number>;
  /** The "ทั้งหมด" figure. Passed rather than summed, so it stays the same
   *  number the heading beside it is counting. */
  total: number;
  /** `null` is "ทั้งหมด" — the same shape the sub page's filter uses. */
  value: RiskSeverity | null;
  onChange: (next: RiskSeverity | null) => void;
}) {
  const cells: { id: RiskSeverity | null; label: string; n: number }[] = [
    { id: null, label: "ทั้งหมด", n: total },
    ...SEVERITY_ORDER.map((id) => ({
      id,
      label: RISK_SEVERITY_META[id].label,
      n: counts[id],
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {cells.map((cell) => {
        const selected = cell.id === value;

        return (
          <Chip
            key={cell.id ?? "all"}
            type="single"
            size="small"
            label={`${cell.label} ${cell.n}`}
            selected={selected}
            disabled={cell.n === 0 && !selected}
            aria-label={`${cell.label} ${cell.n} รายการ`}
            onClick={() => onChange(selected ? null : cell.id)}
          />
        );
      })}
    </div>
  );
}

/**
 * One finding, as a row.
 *
 * Exported because the sub page draws the same rows rather than a table — the
 * precedent `next-best-actions/page.tsx` set for this folder. One definition
 * means the card and the page cannot disagree about what an alert looks like.
 *
 * The tinted square carries **severity**, not category: in a triage list the
 * loudest mark on the row should say how bad a thing is. Which family it
 * belongs to is carried by the glyph's shape and said in words below.
 *
 * No client avatar. `RowIcon`'s own docstring warns that a circle reads as an
 * avatar, and more to the point `clientId` is nullable — a book-level sanctions
 * row would leave an empty column. The name lives in the muted run, where a
 * missing one degrades into a scope word instead of a gap.
 */
export function RiskAlertRowItem({
  row,
  onOpen,
}: {
  row: RiskAlertRow;
  onOpen: () => void;
}) {
  const { alert, acknowledged } = row;
  const severity = RISK_SEVERITY_META[alert.severity];
  const category = RISK_CATEGORY_META[alert.category];
  const CategoryIcon = category.Icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-[var(--fill-p1-100)] ${
        acknowledged ? "opacity-60" : ""
      }`}
    >
      <RowIcon tone={severity.pill}>
        <CategoryIcon size={18} weight="duotone" />
      </RowIcon>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Line one is **who**, and how bad — with elapsed time top-right so
            line two can use the full width and is not squeezed beside it. */}
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <p className="truncate text-[14px] font-bold text-foreground">
            {row.displayName}
          </p>
          {/* `shrink-0` on the `Tag` itself, not on a wrapper. A wrapper
              `<span>` is `display: block`, so the `inline-flex` Tag inside it
              sat on that block's *baseline* rather than being centred — two
              pixels low against the name, which `items-center` on the row could
              not fix, because it was centring the wrapper and the wrapper was
              already centred. As a direct flex item the Tag centres itself. */}
          {acknowledged ? (
            <Tag
              text="รับทราบแล้ว"
              variant="gray"
              size="small"
              className="shrink-0"
            />
          ) : (
            <Tag
              text={severity.label}
              variant={severity.variant}
              size="small"
              className="shrink-0"
            />
          )}
          {/* The deadline sits with the severity, because "how bad" and "by
              when" are the same question asked twice, and only some rules carry
              one. It used to share the right-hand column with the elapsed time,
              which put *by when* and *since when* — opposite directions in
              time — in one slot, so the column read differently row to row.

              Coloured text rather than a second `Tag`: two filled chips side by
              side merge into one block, and this is a qualifier on the tag
              beside it, not a second label. */}
          {alert.daysLeft !== null && (
            <span
              className={`shrink-0 text-[11px] font-semibold ${severity.text}`}
            >
              {deadlineLabel(alert.daysLeft)}
            </span>
          )}
          </div>

          {/* Elapsed time sits top-right — see comment on line two below. */}
          <span
            suppressHydrationWarning
            title={detectedAtLabel(alert.detectedAt, new Date())}
            className="shrink-0 pt-0.5 text-[12px] leading-none tabular-nums text-muted-foreground"
          >
            {detectedAgoLabel(alert.detectedAt, new Date())}
          </span>
        </div>

        {/* Line two is **what**, and where. The finding keeps `text-foreground`
            rather than dropping to muted — demoted from the headline, but still
            the sentence the row is about, where the category and the account
            behind it are context. One run, so `truncate` drops them
            right-to-left: exactly the order they matter least in. */}
        <p
          className="min-w-0 max-w-[80%] truncate text-[12px] text-foreground"
          title={alert.title}
        >
          {alert.title}
          <span className="text-muted-foreground">
            {` · ${category.label}`}
            {alert.accountLabel && ` · ${alert.accountLabel}`}
          </span>
        </p>
      </div>

      {/* Nothing follows. Acknowledging happens in the detail panel, not from a
          tick out here. A row carried one briefly, revealed on hover, to save
          opening a sheet for a finding the desk already recognised. It went
          because clearing a compliance alert is not a thing to do in passing:
          the panel is where the figures and the rule behind it are, and a
          control that disposes of one from a list you are only skimming invites
          exactly the reflex it should not. */}
    </div>
  );
}

/**
 * The last row, when the floor cut something off.
 *
 * A row rather than relying on the header's count, and in the list rather than
 * under it, because this is where the reader arrives: they read down the
 * findings, reach the bottom, and the question they have at that moment is "is
 * that all?". The same argument `KycAlertsPanel`'s `MoreRow` makes.
 *
 * It is a `<Link>`, not a button — unlike the KYC card's, which opens a sheet,
 * this one leaves for a page, and leaving for a page has to survive ⌘-click.
 * One line and no tinted square: what marks this row is that it is *unlike* the
 * findings above it.
 */
function MoreRow({
  count,
  href,
  severity,
}: {
  count: number;
  href: string;
  /** What the hidden rows are, said in words. With a severity picked they are
   *  simply more of it; unfiltered, the criticals are all on screen by
   *  construction, so what is left is the two quieter tiers. */
  severity: RiskSeverity | null;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-2 p-3 text-left no-underline transition-colors hover:bg-[var(--fill-p1-100)]"
    >
      <p className="min-w-0 flex-1 truncate text-[13px] text-foreground">
        <span className="font-bold">ดูอีก {count} รายการ</span>
        <span className="text-muted-foreground">
          {severity
            ? ` · ระดับ${RISK_SEVERITY_META[severity].label}`
            : " · ระดับเฝ้าระวังและข้อสังเกต"}
        </span>
      </p>
      <CaretRightIcon
        size={16}
        className="shrink-0 text-[var(--text-default-placeholder)]"
      />
    </Link>
  );
}
