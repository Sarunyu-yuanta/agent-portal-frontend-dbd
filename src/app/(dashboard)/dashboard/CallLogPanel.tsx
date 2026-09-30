"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@sarunyu/system-one";
import { ArrowDownLeftIcon, ArrowUpRightIcon, PhoneIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import Link from "next/link";
import { ContactFields } from "../calendar/HolderContact";
import { relativeCallDate } from "@/data/call-log-data";
import { CardCount, CARD_LINK_CLASS } from "./CardHeader";
import type { CallLogRow } from "./call-log-feed";

/** Outbound is the desk reaching out, inbound is the client. One glyph and one
 *  hue each — a bare arrow rather than a tinted square, since the direction is
 *  a property of the row, not a thing in its own right. The word stays as the
 *  icon's accessible name: an arrow is unambiguous to look at and says nothing
 *  to a screen reader. */
/** The same two directions, as a filled badge — the list shows a bare arrow
 *  beside 14px text, the record shows a 40px disc beside the client's name. */
const DIRECTION_BADGE = {
  outbound: {
    tone: "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]",
    Icon: ArrowUpRightIcon,
    label: "โทรออก",
  },
  inbound: {
    tone: "bg-[var(--fill-emerald-100)] text-[var(--fill-emerald-600)]",
    Icon: ArrowDownLeftIcon,
    label: "รับสาย",
  },
} as const;

const DIRECTION = {
  outbound: {
    color: "text-[var(--fill-p1-600)]",
    Icon: ArrowUpRightIcon,
    label: "โทรออก",
  },
  inbound: {
    color: "text-[var(--fill-emerald-600)]",
    Icon: ArrowDownLeftIcon,
    label: "รับสาย",
  },
} as const;

/**
 * Every call the desk has logged, across all clients, newest first.
 *
 * A plain history — no ranking, no score, nothing to dismiss. The card shows
 * the most recent few; "ดูทั้งหมด" opens the rest in the same sheet the
 * Reminders and KYC cards use.
 */
export function CallLogPanel({ rows, limit }: { rows: CallLogRow[]; limit: number }) {
  const router = useRouter();
  /** The call whose record is open. A row opens the call, not the client — the
   *  summary in the list is clipped to one line, and the thing you wanted when
   *  you clicked was the rest of that sentence. The client's full history is
   *  one button further on. */
  const [detail, setDetail] = useState<CallLogRow | null>(null);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Header count={0} seeAll={false} />
        <EmptyState
        icon={<PhoneIcon size={40} weight="duotone" className="text-[var(--text-default-placeholder)]" />}
          title="ยังไม่มีบันทึกการโทร"
          body="สายที่บันทึกไว้จากลูกค้าทุกรายจะมารวมกันที่นี่"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Header count={rows.length} seeAll={rows.length > limit} />

      {/* One surface with rules inside it, rather than a stack of separate
          boxes: a log is a continuous record, and five outlined cards in a
          column made each call look like its own object. The container carries
          the border and the fill; a row only draws its own hover. */}
      <div className="overflow-hidden rounded-2xl bg-[var(--bg-default-secondary)] divide-y divide-black/[0.05]">
        {rows.slice(0, limit).map((row) => (
          <CallRow key={row.id} row={row} onOpen={() => setDetail(row)} />
        ))}
      </div>

      <CallDetailModal
        row={detail}
        onClose={() => setDetail(null)}
        onViewClient={(clientId) => {
          setDetail(null);
          router.push(callLogHref(clientId));
        }}
      />
    </div>
  );
}

/**
 * One call, in full.
 *
 * Everything the list had to clip: the whole summary, the exact date rather
 * than "2 months ago", and whose call it was said plainly rather than implied
 * by a row's position.
 */
export function CallDetailModal({
  row,
  onClose,
  onViewClient,
}: {
  row: CallLogRow | null;
  onClose: () => void;
  onViewClient: (clientId: string) => void;
}) {
  if (!row) return null;
  const { tone, Icon, label } = DIRECTION_BADGE[row.entry.direction];

  return (
    <ResponsiveBottomSheetModal
      open
      onClose={onClose}
      title="รายละเอียดการโทร"
      titleId="dashboard-call-detail"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
            <Icon size={20} weight="bold" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="type-body-1 font-semibold text-foreground">{row.clientName}</p>
            <p className="type-caption text-muted-foreground">
              {label} · {row.entry.date} · {row.entry.time} · {row.entry.duration}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[var(--bg-default-secondary)] p-4">
          <p className="type-body-2 leading-relaxed text-foreground">{row.entry.summary}</p>
        </div>

        {/* The same contact block a KYC row opens, under the summary rather than
            behind a second tap. What a record of a call leaves you wanting is a
            way to make the next one, and this record already knows whose call it
            was — so the number belongs on it, not one step further on.

            Captioned because the summary above it wears the same soft fill:
            unlabelled, two grey boxes in a column read as one continuing block
            rather than the call and the client. */}
        <div className="flex flex-col gap-2">
          <p className="type-caption font-semibold text-muted-foreground">
            ช่องทางติดต่อ
          </p>
          <ContactFields clientId={row.clientId} />
        </div>
      </div>

      <div className="flex shrink-0 justify-center border-t border-border px-4 py-3">
        <Button variant="plain" size="sm" onClick={() => onViewClient(row.clientId)}>
          ดูประวัติการโทรทั้งหมดของลูกค้า
        </Button>
      </div>
    </ResponsiveBottomSheetModal>
  );
}

function Header({ count, seeAll }: { count: number; seeAll: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <h6 className="type-h6 text-foreground">Call Log</h6>
      {count > 0 && <CardCount value={count} />}
      <span className="flex-1" />
      {/* A page now, not a sheet — thirteen calls each with a record behind it
          is somewhere you arrive rather than something that opens over what you
          were reading. A `Link` styled as the design system's plain button, for
          the reason `HolderContact` gives: `Button` has no `asChild`, and this
          one should keep middle-click and open-in-new-tab. */}
      {seeAll && (
        <Link
          href={CALL_LOG_PAGE}
          className={CARD_LINK_CLASS}
        >
          ดูทั้งหมด
        </Link>
      )}
    </div>
  );
}

/** The whole book's log, as its own page. */
export const CALL_LOG_PAGE = "/dashboard/call-log";

function callLogHref(clientId: string): string {
  return `/client/${clientId}?tab=call-log`;
}

export function CallRow({ row, onOpen }: { row: CallLogRow; onOpen: () => void }) {
  const { color, Icon, label } = DIRECTION[row.entry.direction];

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
      className="flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-[var(--fill-p1-100)]"
    >
      <Icon
        size={18}
        weight="bold"
        role="img"
        aria-label={label}
        className={`mt-0.5 shrink-0 ${color}`}
      />

      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <p className="truncate text-[14px] font-bold text-foreground">{row.clientName}</p>
        {/* One line. It does cut most summaries mid-sentence, so the full text
            is on the row's tooltip and the whole row opens the client's own
            Call Log tab, where it is not cut at all. */}
        <p className="truncate text-[11px] text-muted-foreground" title={row.entry.summary}>
          {row.entry.summary}
        </p>
      </div>

      {/* Relative on top because "2 months ago" is what a reader is scanning
          for; the clock time and length sit under it for when they are not. */}
      <div className="shrink-0 text-right">
        <p className="text-[11px] font-medium text-foreground">{relativeCallDate(row.entry.date)}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
          {row.entry.time} · {row.entry.duration}
        </p>
      </div>
    </div>
  );
}
