"use client";

import { useState } from "react";
import Link from "next/link";
import { IdentificationCardIcon } from "@phosphor-icons/react";
import type { DayItem } from "../calendar/day-items";
import { HolderContactOverlay } from "../calendar/HolderContact";
import { ReminderPreviewRow, RemindersPreviewEmpty } from "../calendar/reminder-preview";
import { kycCheckpointTone } from "../use-kyc-notification-feed";
import { CARD_LINK_CLASS } from "./CardHeader";
import type { QueueItem } from "./dashboard-data";

/** A reminder already placed on its calendar day, ready for the preview row. */
export type PreviewReminder = {
  item: DayItem;
  day: Date;
  /** Whole days from today. `0` is the row that says "Due today". */
  daysUntil: number;
};

/**
 * The Dashboard's reminder card.
 *
 * The same rows the Client 360 Overview card draws, gathered across every
 * client instead of one — so each row also says who it is about. The card
 * itself only ever shows the day the calendar is pointing at; "ดูทั้งหมด"
 * is the way out to the rest.
 *
 * That way out is the Calendar's Reminder tab, not a sheet over this page. The
 * rest is everything from a quarter back to a quarter ahead, ticked-off ones
 * included — a list that long is somewhere you go, and it is already the
 * Calendar's own second view rather than a copy kept here.
 *
 * KYC expiries land here too, but only the ones dated today. A record lapsing
 * this morning is a thing due today whatever produced the date, and the
 * Calendar's Reminder tab lists them for the same reason. It stops at today
 * because the KYC card two rows down this rail already owns the fortnight
 * ahead, and a card that repeated it would be asking the reader to notice the
 * same five names twice.
 */
export function RemindersPanel({
  dayItems,
  kycItems,
  clientNames,
  onOpen,
}: {
  dayItems: PreviewReminder[];
  /** Expiring today, and only today — see above. `buildQueue`'s own rows, so
   *  this card and the KYC card cannot word the same deadline differently. */
  kycItems: QueueItem[];
  clientNames: Map<string, string>;
  onOpen: (item: DayItem, day: Date) => void;
}) {
  /** Opened by a KYC row: the person, not the record. Same call the KYC card
   *  and the Calendar's Reminder tab make. */
  const [contact, setContact] = useState<{ clientId: string; name: string } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h6 className="type-h6 text-foreground">Reminders</h6>
        {/* Straight to the Calendar's Reminder tab — the list of everything
            lives there, beside the grid that places the same rows on days. */}
        <Link href="/calendar?tab=reminder" className={CARD_LINK_CLASS}>
          ดูทั้งหมด
        </Link>
      </div>

      {/* The card is always today, so the label is the word and nothing else —
          no date, no badge. The rows used to carry "Due today · 29 Sept 2026"
          one by one, which said the same thing as many times as there were rows
          and still left the card without a heading; said once up here, the rows
          are free to say only what is on the day. The Calendar's Reminder tab
          prints real dates over its groups because it has three months of them
          to tell apart — this has one. */}
      <p className="type-caption font-semibold text-muted-foreground">วันนี้</p>

      {/* One surface with rules inside it, matching the other lists on this
          page. The rows go `flush` so the list owns the radius and fill. */}
      {dayItems.length === 0 && kycItems.length === 0 ? (
        <RemindersPreviewEmpty />
      ) : (
        <div className="overflow-hidden rounded-xl bg-[var(--bg-default-secondary)] divide-y divide-black/[0.05] flex flex-col">
          {/* KYC first: it is the only deadline in here with a rule behind it,
              which is the order `SOURCE_WEIGHT` in `dashboard-data` puts the
              same sources in. A card, not a bell — nobody set an alarm on a KYC
              record, it expires on its own. */}
          {kycItems.map((row) => (
            <ReminderPreviewRow
              key={row.id}
              title={row.title}
              meta={row.detail}
              dayIso={row.day.toISOString()}
              dueToday
              icon={<IdentificationCardIcon size={18} weight="duotone" />}
              iconToneClassName={kycCheckpointTone(row.daysLeft)}
              onClick={() =>
                setContact({ clientId: row.clientIds[0], name: row.title })
              }
              flush
              showDate={false}
            />
          ))}
          {dayItems.map((row) => (
            <ReminderPreviewRow
              key={row.item.id}
              title={row.item.title}
              meta={clientLine(row.item, clientNames)}
              dayIso={row.day.toISOString()}
              dueToday={row.daysUntil === 0}
              onClick={() => onOpen(row.item, row.day)}
              flush
              showDate={false}
            />
          ))}
        </div>
      )}

      {contact && (
        <HolderContactOverlay
          clientId={contact.clientId}
          name={contact.name}
          onClose={() => setContact(null)}
        />
      )}
    </div>
  );
}

function clientLine(item: DayItem, clientNames: Map<string, string>): string | undefined {
  const names = item.clientIds
    .map((id) => clientNames.get(id))
    .filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(", ") : undefined;
}
