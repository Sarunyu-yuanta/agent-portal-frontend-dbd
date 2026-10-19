"use client";

import { useMemo, useState } from "react";
import { Button, Checkbox } from "@sarunyu/system-one";
import { EnvelopeSimpleIcon, ProhibitIcon } from "@phosphor-icons/react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { TierBadge } from "@/components/ui/tier-badge";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import type { CampaignMaterial } from "@/types/domain";
import { CLIENT_STATUS_LABEL, type CampaignClientRow } from "../campaign-data";

/**
 * Pick who one piece of material goes to.
 *
 * Sharing used to be spread across three places — a button on each material, a
 * "เลือกสำหรับส่งหลายคน" selection that armed the material, and a second share
 * button on the clients table further down the page. Sending anything meant
 * holding a selection in your head while scrolling between the two. This is
 * the whole of it instead: press share on a material, tick the clients, send.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * The send itself is a concept. `shareMaterial` in `contexts/campaigns-context`
 * records who it went to and writes the compliance log; what it does *not* do
 * is deliver anything, because there is no mail service behind this yet. The
 * dialog says so in as many words rather than implying a mail has gone out.
 * When that service exists, this screen does not change — the store's mutator
 * is where it lands.
 */
export function ShareDialog({
  open,
  onOpenChange,
  material,
  rows,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The material being sent. `null` closes the dialog. */
  material: CampaignMaterial | null;
  /** Everyone the campaign concerns; the ineligible are shown but unpickable. */
  rows: CampaignClientRow[];
  onConfirm: (clientIds: string[]) => void;
}) {
  const { isPrivate } = usePrivacy();
  const [picked, setPicked] = useState<Set<string>>(new Set());

  /**
   * Closing clears the ticks, so the next material never inherits them.
   *
   * On the way out rather than on the way in: resetting when `open` turns true
   * means a `setState` inside an effect, which costs a second render pass and
   * is what `react-hooks/set-state-in-effect` is there to catch. Same result,
   * no cascade.
   */
  const setOpen = (next: boolean) => {
    if (!next) setPicked(new Set());
    onOpenChange(next);
  };

  const selectable = useMemo(
    () => rows.filter((row) => row.eligible).map((row) => row.client.id),
    [rows],
  );

  const allPicked = selectable.length > 0 && picked.size === selectable.length;

  const toggle = (id: string, next: boolean) =>
    setPicked((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="แชร์ให้ลูกค้า"
      headerAction={
        selectable.length > 0
          ? {
              label: allPicked ? "ล้างที่เลือก" : "เลือกทั้งหมด",
              onClick: () =>
                setPicked(allPicked ? new Set() : new Set(selectable)),
            }
          : undefined
      }
      closeOnBackdrop
      desktopContentClassName="w-[460px] max-w-full"
    >
      <div className="flex flex-col gap-4 pt-1">
        {material && (
          <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-[12.5px] leading-snug text-muted-foreground">
            กำลังจะส่ง{" "}
            <span className="font-semibold text-foreground">{material.label}</span>{" "}
            <span className="tabular-nums">({material.version})</span>
          </p>
        )}

        <div className="flex max-h-[42vh] flex-col gap-1 overflow-y-auto">
          {rows.map((row) => {
            const name = maskName(row.client.name, isPrivate);
            if (!row.eligible) {
              return (
                <div
                  key={row.client.id}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 opacity-60"
                >
                  <ProhibitIcon
                    size={16}
                    className="shrink-0 text-[var(--text-default-placeholder)]"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {name}
                    </p>
                    <p className="truncate text-[11.5px] leading-snug text-muted-foreground">
                      {row.ineligibleReason ?? "ไม่เข้าเงื่อนไขของแคมเปญนี้"}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <label
                key={row.client.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <Checkbox
                  checked={picked.has(row.client.id)}
                  onChange={(next) => toggle(row.client.id, next)}
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">
                  {name}
                </span>
                <TierBadge tier={row.client.membershipTier} />
                <span className="shrink-0 text-[11.5px] text-muted-foreground">
                  {CLIENT_STATUS_LABEL[row.status]}
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {/* Said plainly, because it is not true yet: the record is written,
              the mail is not sent. */}
          <p className="flex items-start gap-1.5 text-[12px] leading-snug text-muted-foreground">
            <EnvelopeSimpleIcon size={14} className="mt-0.5 shrink-0" />
            ระบบหลังบ้านจะส่งอีเมลให้ลูกค้าที่เลือก และบันทึกการส่งไว้เพื่อการตรวจสอบ
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={picked.size === 0}
            onClick={() => {
              onConfirm([...picked]);
              setOpen(false);
            }}
          >
            {picked.size > 0 ? `ส่งให้ ${picked.size} ลูกค้า` : "เลือกลูกค้าก่อน"}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
