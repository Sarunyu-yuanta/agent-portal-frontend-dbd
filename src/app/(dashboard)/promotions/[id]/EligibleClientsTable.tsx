"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  PaperPlaneTiltIcon,
  ProhibitIcon,
  UserCheckIcon,
} from "@phosphor-icons/react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  Tooltip,
} from "@sarunyu/system-one";
import type { TagVariant } from "@sarunyu/system-one";
import { TierBadge } from "@/components/ui/tier-badge";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { formatAumThb } from "@/lib/client-utils";
import type { CampaignClientStatus, ClientSegment } from "@/types/domain";
import {
  CLIENT_STATUS_LABEL,
  SEGMENT_LABEL,
  type CampaignClientRow,
} from "../campaign-data";
import { segmentsOfClient } from "@/lib/campaign-mock-data";

/**
 * Who this promotion is for, and how far each of them has got.
 *
 * Ineligible clients stay in the table rather than being filtered out of it:
 * "why is this client missing" is a question the IC will otherwise ask the
 * desk, and the answer is already on the record. Their row is disabled, their
 * checkbox is gone, and the reason is printed where the status would be.
 *
 * The header checkbox selects only what can actually be sent — selecting a
 * blocked row and then being silently dropped by the store would read as the
 * share having failed.
 */

const STATUS_VARIANT: Record<CampaignClientStatus, TagVariant> = {
  "not-sent": "gray",
  sent: "blue",
  interested: "yellow",
  redeemed: "green",
};

export function EligibleClientsTable({
  rows,
  campaignSegments,
  /** `null` when a bulk share is possible; otherwise why it isn't. */
  shareDisabledReason,
  onShare,
  onSetStatus,
}: {
  rows: CampaignClientRow[];
  /** Which segments this campaign is for — the "why they qualify" column. */
  campaignSegments: ClientSegment[];
  shareDisabledReason: string | null;
  onShare: (clientIds: string[]) => void;
  onSetStatus: (clientId: string, status: CampaignClientStatus) => void;
}) {
  const { isPrivate } = usePrivacy();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectable = useMemo(
    () => rows.filter((row) => row.eligible).map((row) => row.client.id),
    [rows],
  );
  const picked = useMemo(
    () => selectable.filter((id) => selected.has(id)),
    [selectable, selected],
  );

  const headerCheck =
    picked.length === 0
      ? false
      : picked.length === selectable.length
        ? true
        : "indeterminate";

  const toggleAll = (next: boolean) =>
    setSelected(next ? new Set(selectable) : new Set());

  const toggleOne = (id: string, next: boolean) =>
    setSelected((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });

  const share = () => {
    onShare(picked);
    setSelected(new Set());
  };

  const shareButton = (
    <Button
      variant="primary"
      size="md"
      leftIcon={<PaperPlaneTiltIcon size={16} weight="fill" />}
      disabled={picked.length === 0 || shareDisabledReason !== null}
      onClick={share}
    >
      {picked.length > 0 ? `แชร์ให้ ${picked.length} ลูกค้า` : "แชร์ให้ลูกค้า"}
    </Button>
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="type-subtitle-1 font-bold text-foreground">
            ลูกค้าที่เข้าเงื่อนไข
          </h2>
          <p className="text-[12.5px] text-muted-foreground">
            เลือกลูกค้าแล้วกดแชร์ เพื่อส่งสื่อที่เลือกไว้ให้พร้อมกันหลายคน
          </p>
        </div>

        {/* The tooltip is only mounted when there is something to explain —
            `Tooltip` has no controlled `open`, so wrapping unconditionally
            would pop an empty bubble over a button that works fine. The span
            is needed because a disabled button fires no pointer events of its
            own for the tooltip to hang on. */}
        {shareDisabledReason ? (
          <Tooltip content={shareDisabledReason} side="top" delayDuration={200}>
            <span>{shareButton}</span>
          </Tooltip>
        ) : (
          shareButton
        )}
      </div>

      <div className="relative overflow-x-auto rounded-lg border border-[var(--border-default)]">
        <Table className="w-full" style={{ minWidth: 820 }}>
          <TableHead>
            <TableRow>
              <TableHeaderCell
                type="check"
                style={{ width: 52 }}
                checkState={headerCheck}
                onCheckChange={toggleAll}
              />
              <TableHeaderCell style={{ width: 220 }}>ลูกค้า</TableHeaderCell>
              <TableHeaderCell style={{ width: 120 }}>ระดับ</TableHeaderCell>
              <TableHeaderCell style={{ width: 140 }}>AUM</TableHeaderCell>
              <TableHeaderCell style={{ width: 190 }}>กลุ่มที่เข้าเงื่อนไข</TableHeaderCell>
              <TableHeaderCell style={{ width: 210 }}>สถานะ</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const name = maskName(row.client.name, isPrivate);
              // Only the segments that actually put them in *this* campaign —
              // listing every segment a client belongs to would answer a
              // question nobody asked and bury the one that matters.
              const matched = segmentsOfClient(row.client).filter((s) =>
                campaignSegments.includes(s),
              );
              return (
                <TableRow
                  key={row.client.id}
                  selected={selected.has(row.client.id)}
                  onSelectedChange={
                    row.eligible
                      ? (next) => toggleOne(row.client.id, next)
                      : undefined
                  }
                  className={row.eligible ? "" : "opacity-60"}
                >
                  <TableCell type={row.eligible ? "checkbox" : "default"}>
                    {!row.eligible && (
                      <ProhibitIcon
                        size={16}
                        className="text-[var(--text-default-placeholder)]"
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    {/* The client's own profile is one click away; an IC
                        deciding who to send to usually wants to look first. */}
                    <Link
                      href={`/client/${row.client.id}`}
                      className="text-[13px] font-semibold text-foreground no-underline hover:text-primary-action hover:underline"
                    >
                      {name}
                    </Link>
                  </TableCell>

                  <TableCell>
                    <TierBadge tier={row.client.membershipTier} />
                  </TableCell>

                  <TableCell>
                    <p className="text-[13px] tabular-nums text-foreground">
                      {formatAumThb(row.client.aum)}
                    </p>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {matched.slice(0, 2).map((segment) => (
                        <Tag
                          key={segment}
                          text={SEGMENT_LABEL[segment]}
                          variant="gray"
                          size="small"
                        />
                      ))}
                    </div>
                  </TableCell>

                  <TableCell>
                    {row.eligible ? (
                      <StatusCell row={row} onSetStatus={onSetStatus} />
                    ) : (
                      <p className="text-[12px] leading-snug text-muted-foreground">
                        {row.ineligibleReason ?? "ไม่เข้าเงื่อนไขของแคมเปญนี้"}
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

/**
 * The status, and the one move that follows it.
 *
 * Only the forward step is offered: a client who has been sent something can be
 * marked interested, and an interested one can be marked as having used the
 * offer. Going back is not a thing an IC does — it is a correction, and this
 * mock has no undo to hang it on.
 */
function StatusCell({
  row,
  onSetStatus,
}: {
  row: CampaignClientRow;
  onSetStatus: (clientId: string, status: CampaignClientStatus) => void;
}) {
  const next: CampaignClientStatus | null =
    row.status === "sent"
      ? "interested"
      : row.status === "interested"
        ? "redeemed"
        : null;

  return (
    <div className="flex items-center gap-2">
      <Tag
        text={CLIENT_STATUS_LABEL[row.status]}
        variant={STATUS_VARIANT[row.status]}
        size="small"
      />
      {next && (
        <button
          type="button"
          onClick={() => onSetStatus(row.client.id, next)}
          className="flex cursor-pointer items-center gap-1 text-[12px] font-medium text-primary-action hover:underline"
        >
          <UserCheckIcon size={13} />
          ทำเครื่องหมาย{CLIENT_STATUS_LABEL[next]}
        </button>
      )}
    </div>
  );
}
