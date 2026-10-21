"use client";

import { useState } from "react";
import { Alert, Button, Tag } from "@sarunyu/system-one";
import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  PhoneIcon,
} from "@phosphor-icons/react";
import { ButtonLink } from "@/components/ui/button-link";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { ContactFields } from "../calendar/HolderContact";
import type { RiskAlert } from "@/types/domain";
import {
  deadlineLabel,
  detectedAtLabel,
  RISK_CATEGORY_META,
  RISK_SEVERITY_META,
} from "./risk-config";
import type { RiskAlertRow } from "./risk-feed";

/**
 * One finding, in full: what it is, the figures that triggered it, and what to
 * do about it.
 *
 * Three questions in that order, because that is the order they get asked. The
 * list can only ever carry the first, clipped to a line.
 *
 * A `ResponsiveBottomSheetModal` because every row-click on the Command Center
 * already opens one — the call record, the KYC sheet, a holder's contact card —
 * and a risk row opening a different kind of surface would be the only one that
 * did. `DetailDrawer` is the idiom for a *section* page whose whole job is the
 * list, and a non-modal right-hand drawer opened from a card halfway down a
 * scrolling column reads as a panel belonging to nothing.
 *
 * No two-pane sliding track. `KycAlertsPanel` has one because its sheet is a
 * *list* that drills into a contact — two levels in one surface. This opens on
 * one alert; there is nothing to come back to, so the contact rows go inline,
 * the way the call record does.
 */
export function RiskAlertDetail({
  row,
  onClose,
  onAcknowledge,
  onUnacknowledge,
}: {
  row: RiskAlertRow | null;
  onClose: () => void;
  onAcknowledge: (alert: RiskAlert) => void;
  /** Only the full list shows acknowledged findings, so only it can undo one.
   *  The Command Center card filters them out and never passes this. */
  onUnacknowledge?: (alert: RiskAlert) => void;
}) {
  /**
   * Which alert's contact details are showing, rather than a bare boolean.
   *
   * Contact rows are revealed, not always shown: most of these sheets are read
   * and cleared without a call, and an always-open block put three copy rows
   * between the advice and the buttons.
   *
   * Holding the *id* is what resets it. A boolean would need an effect to clear
   * itself when the next alert opens, and a `setState` in an effect is a
   * cascading render for a value that was already derivable — comparing against
   * the open alert gets the same reset for free, and keeps the block expanded
   * through the sheet's own closing animation rather than collapsing it on the
   * way out.
   */
  const [contactFor, setContactFor] = useState<string | null>(null);

  if (!row) return null;

  const contactOpen = contactFor === row.alert.id;

  const { alert } = row;
  const severity = RISK_SEVERITY_META[alert.severity];
  const category = RISK_CATEGORY_META[alert.category];
  const CategoryIcon = category.Icon;
  const SeverityIcon = severity.Icon;

  return (
    <ResponsiveBottomSheetModal
      open
      onClose={onClose}
      title="รายละเอียดความเสี่ยง"
      titleId="risk-alert-detail"
      desktopMaxWidth="max-w-[560px]"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {/* The square takes the *category* hue here — severity is stated by the
            Tag an inch below, so the colour is free to mean the other thing. */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${category.tone}`}
          >
            <CategoryIcon size={20} weight="duotone" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {/* Whose problem this is, first — the same order the row the reader
                just clicked now uses. The finding follows it.

                `font-bold!`, with the bang: `.type-body-1` sets its own
                `font-weight` from a stylesheet that loads after `globals.css`,
                so a plain Tailwind weight ties on specificity and loses — this
                line rendered at 400 beside a 400 title until it was flagged.
                Same trap `tier-badge` documents. */}
            <p className="type-body-1 font-bold! leading-snug text-foreground">
              {row.displayName}
            </p>
            <p className="type-body-2 leading-snug text-foreground">
              {alert.title}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag text={severity.label} variant={severity.variant} size="small" />
              <Tag text={category.label} variant="gray" size="small" />
            </div>
            {/* Raw `text-[11px]` rather than `.type-caption`, which sets its own
                `font-weight` from a stylesheet loading after `globals.css` — the
                same trap `tier-badge` documents, sidestepped rather than fought
                with a trailing `!`. */}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {alert.accountLabel && `${alert.accountLabel} · `}
              {detectedAtLabel(alert.detectedAt, new Date())}
              {` · กฎ ${alert.ruleCode}`}
            </p>
          </div>
        </div>

        {/* The deadline, when the rule carries one. A full-width tinted band
            rather than a pill: this is the sentence that decides whether the
            sheet gets acted on now or filed. */}
        {alert.daysLeft !== null && (
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${severity.bar}`}
          >
            <SeverityIcon size={16} weight="fill" className="shrink-0" />
            <p className="type-body-2 font-semibold">
              {deadlineLabel(alert.daysLeft)}
            </p>
          </div>
        )}

        <Section title="รายละเอียด">
          <div className="rounded-xl bg-[var(--bg-default-secondary)] p-4">
            <p className="type-body-2 leading-relaxed text-foreground">
              {alert.message}
            </p>
          </div>
        </Section>

        {alert.metrics.length > 0 && (
          <Section title="ตัวเลขที่ทำให้เกิดการแจ้งเตือน">
            {/* `flex`, not `grid-cols-1 sm:grid-cols-2`: `@sarunyu/system-one`
                ships an unlayered `.grid-cols-1` that loads after
                `globals.css` and takes the source-order tie, so the responsive
                utility never applies. Flex has nothing to collide with. */}
            <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-black/[0.05] sm:flex-row sm:flex-wrap">
              {alert.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex flex-1 flex-col gap-1 bg-[var(--bg-default-secondary)] px-3 py-2.5 sm:min-w-[calc(50%-1px)]"
                >
                  <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                  <p
                    className={`tabular-nums font-bold text-foreground ${
                      metric.emphasis ? "text-[16px]" : "text-[14px]"
                    }`}
                  >
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="สิ่งที่ควรทำต่อ">
          <div className="rounded-xl border border-border p-4">
            <p className="type-body-2 leading-relaxed text-foreground">
              {alert.recommendedAction}
            </p>
          </div>
        </Section>

        {/* Why the contact button is missing. Said out loud rather than left to
            a disabled control: "ห้ามถาม" is a rule an IC has to know, and an
            absent button teaches nothing. */}
        {!alert.contactAllowed && alert.contactNote && (
          <Alert status="warning" title="ข้อจำกัดในการติดต่อ" message={alert.contactNote} multiline />
        )}

        {contactOpen && alert.clientId && (
          <Section title="ช่องทางติดต่อ">
            <ContactFields clientId={alert.clientId} />
          </Section>
        )}
      </div>

      {/* Acknowledge on the left — it is the quiet exit; the two ways forward on
          the right. `flex-wrap` so three controls survive a 360px phone rather
          than being squeezed under their own labels. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
        {alert.dismissible && row.acknowledged && onUnacknowledge ? (
          /* The only way back. The row used to carry a tick that toggled both
             ways; with that gone, an acknowledged finding opened from the
             archive would otherwise be a one-way door. */
          <Button
            variant="plain"
            size="sm"
            leftIcon={<ArrowCounterClockwiseIcon size={16} weight="bold" />}
            onClick={() => onUnacknowledge(alert)}
          >
            ยกเลิกการรับทราบ
          </Button>
        ) : alert.dismissible ? (
          <Button
            variant="plain"
            size="sm"
            leftIcon={<CheckCircleIcon size={16} weight="fill" />}
            onClick={() => onAcknowledge(alert)}
          >
            รับทราบ
          </Button>
        ) : (
          /* Not a disabled button. A greyed "รับทราบ" says "try again later";
             this row is never going to be closable by an IC, and the sentence
             is the information. */
          <p className="text-[11px] text-muted-foreground">
            ต้องให้ฝ่ายกำกับเป็นผู้ปิดรายการนี้
          </p>
        )}

        <div className="flex items-center gap-2">
          {alert.clientId && alert.contactAllowed && !contactOpen && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<PhoneIcon size={16} weight="fill" />}
              onClick={() => setContactFor(alert.id)}
            >
              ติดต่อลูกค้า
            </Button>
          )}
          {alert.clientId && (
            /* A `<Link>` wearing `Button`'s clothes — `ButtonLink` exists for
               exactly this: an action that *navigates* has to keep ⌘-click and
               "open in new tab", and `Button` has no `asChild`. */
            <ButtonLink
              href={`/client/${alert.clientId}`}
              variant="primary"
              size="sm"
            >
              ดูโปรไฟล์ลูกค้า
            </ButtonLink>
          )}
        </div>
      </div>
    </ResponsiveBottomSheetModal>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
