"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  NotePencilIcon,
  ProhibitIcon,
  UserPlusIcon,
  XCircleIcon,
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
import type { RsvpStatus } from "@/types/domain";
import { RSVP_LABEL, type CampaignClientRow } from "../campaign-data";

/**
 * Who is coming, and — once the event has happened — who actually came.
 *
 * One table across both halves of an event's life rather than two, because the
 * rows are the same people and the IC's question only changes tense. What
 * changes is the actions column: before the event it offers registration and
 * confirmation; after it, attendance and a follow-up.
 *
 * Registration is refused when the seats are gone. The store enforces that too
 * (`registerClients` throws), so the disabled checkbox here is the explanation
 * rather than the rule.
 */

const RSVP_VARIANT: Record<RsvpStatus, TagVariant> = {
  registered: "blue",
  confirmed: "green",
  attended: "lime",
  "no-show": "red",
};

export function RsvpTable({
  rows,
  seatsLeft,
  isPast,
  onRegister,
  onSetRsvp,
  onFollowUp,
}: {
  rows: CampaignClientRow[];
  /** `null` for an event with no seat cap. */
  seatsLeft: number | null;
  /** The event has been held — attendance can be marked, registration cannot. */
  isPast: boolean;
  onRegister: (clientIds: string[]) => void;
  onSetRsvp: (clientId: string, status: RsvpStatus) => void;
  /** Opens a note about this client, prefilled from the event. */
  onFollowUp: (clientId: string) => void;
}) {
  const { isPrivate } = usePrivacy();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const full = seatsLeft === 0;

  /** Eligible, not already holding a seat, and the event is still ahead. */
  const selectable = useMemo(
    () =>
      isPast || full
        ? []
        : rows
            .filter((row) => row.eligible && row.rsvp === undefined)
            .map((row) => row.client.id),
    [rows, isPast, full],
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

  const register = () => {
    onRegister(picked);
    setSelected(new Set());
  };

  const overCapacity = seatsLeft !== null && picked.length > seatsLeft;
  const blockedReason = isPast
    ? "งานนี้จัดไปแล้ว ไม่สามารถลงทะเบียนเพิ่มได้"
    : full
      ? "ที่นั่งเต็มแล้ว"
      : overCapacity
        ? `เหลือ ${seatsLeft} ที่นั่ง แต่เลือกไว้ ${picked.length} คน`
        : null;

  const registerButton = (
    <Button
      variant="primary"
      size="md"
      leftIcon={<UserPlusIcon size={16} weight="fill" />}
      disabled={picked.length === 0 || blockedReason !== null}
      onClick={register}
    >
      {picked.length > 0
        ? `ลงทะเบียนให้ ${picked.length} ลูกค้า`
        : "ลงทะเบียนให้ลูกค้า"}
    </Button>
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="type-subtitle-1 font-bold text-foreground">
            {isPast ? "ผู้เข้าร่วมงาน" : "ลงทะเบียนให้ลูกค้า"}
          </h2>
          <p className="text-[12.5px] text-muted-foreground">
            {isPast
              ? "บันทึกการเข้าร่วม แล้วกดติดตามผลเพื่อสร้างโน้ตถึงลูกค้า"
              : "เลือกลูกค้าที่เข้าเงื่อนไข แล้วกดลงทะเบียนเพื่อจองที่นั่งให้"}
          </p>
        </div>

        {!isPast &&
          (blockedReason ? (
            <Tooltip content={blockedReason} side="top" delayDuration={200}>
              <span>{registerButton}</span>
            </Tooltip>
          ) : (
            registerButton
          ))}
      </div>

      <div className="relative overflow-x-auto rounded-lg border border-[var(--border-default)]">
        <Table className="w-full" style={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableHeaderCell
                type="check"
                style={{ width: 52 }}
                checkState={headerCheck}
                onCheckChange={(next) =>
                  setSelected(next ? new Set(selectable) : new Set())
                }
              />
              <TableHeaderCell style={{ width: 230 }}>ลูกค้า</TableHeaderCell>
              <TableHeaderCell style={{ width: 130 }}>ระดับ</TableHeaderCell>
              <TableHeaderCell style={{ width: 150 }}>สถานะ</TableHeaderCell>
              <TableHeaderCell style={{ width: 240 }}>การดำเนินการ</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const checkable = selectable.includes(row.client.id);
              return (
                <TableRow
                  key={row.client.id}
                  selected={selected.has(row.client.id)}
                  onSelectedChange={
                    checkable
                      ? (next) =>
                          setSelected((prev) => {
                            const copy = new Set(prev);
                            if (next) copy.add(row.client.id);
                            else copy.delete(row.client.id);
                            return copy;
                          })
                      : undefined
                  }
                  className={row.eligible ? "" : "opacity-60"}
                >
                  <TableCell type={checkable ? "checkbox" : "default"}>
                    {!row.eligible && (
                      <ProhibitIcon
                        size={16}
                        className="text-[var(--text-default-placeholder)]"
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/client/${row.client.id}`}
                      className="text-[13px] font-semibold text-foreground no-underline hover:text-primary-action hover:underline"
                    >
                      {maskName(row.client.name, isPrivate)}
                    </Link>
                  </TableCell>

                  <TableCell>
                    <TierBadge tier={row.client.membershipTier} />
                  </TableCell>

                  <TableCell>
                    {row.rsvp ? (
                      <Tag
                        text={RSVP_LABEL[row.rsvp]}
                        variant={RSVP_VARIANT[row.rsvp]}
                        size="small"
                      />
                    ) : row.eligible ? (
                      <span className="text-[12.5px] text-muted-foreground">
                        ยังไม่ลงทะเบียน
                      </span>
                    ) : (
                      <span className="text-[12px] leading-snug text-muted-foreground">
                        {row.ineligibleReason ?? "ไม่เข้าเงื่อนไขของงานนี้"}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <RsvpActions
                      row={row}
                      isPast={isPast}
                      onSetRsvp={onSetRsvp}
                      onFollowUp={onFollowUp}
                    />
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
 * The moves available on one row.
 *
 * Before the event, the only one is confirming a seat someone has registered
 * for. After it, both attendance outcomes are offered side by side — neither is
 * the default, and guessing would put a "ไม่มา" on someone's record by
 * accident. Once an outcome is recorded, the follow-up takes its place.
 */
function RsvpActions({
  row,
  isPast,
  onSetRsvp,
  onFollowUp,
}: {
  row: CampaignClientRow;
  isPast: boolean;
  onSetRsvp: (clientId: string, status: RsvpStatus) => void;
  onFollowUp: (clientId: string) => void;
}) {
  const id = row.client.id;

  if (!row.rsvp) {
    return <span className="text-[12.5px] text-muted-foreground">—</span>;
  }

  if (!isPast) {
    return row.rsvp === "registered" ? (
      <button
        type="button"
        onClick={() => onSetRsvp(id, "confirmed")}
        className="flex cursor-pointer items-center gap-1 text-[12.5px] font-medium text-primary-action hover:underline"
      >
        <CheckCircleIcon size={14} weight="fill" />
        ยืนยันที่นั่ง
      </button>
    ) : (
      <span className="text-[12.5px] text-muted-foreground">ยืนยันแล้ว</span>
    );
  }

  const settled = row.rsvp === "attended" || row.rsvp === "no-show";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {!settled && (
        <>
          <button
            type="button"
            onClick={() => onSetRsvp(id, "attended")}
            className="flex cursor-pointer items-center gap-1 text-[12.5px] font-medium text-[var(--success,#059669)] hover:underline"
          >
            <CheckCircleIcon size={14} weight="fill" />
            เข้าร่วม
          </button>
          <button
            type="button"
            onClick={() => onSetRsvp(id, "no-show")}
            className="flex cursor-pointer items-center gap-1 text-[12.5px] font-medium text-[var(--fill-red-600)] hover:underline"
          >
            <XCircleIcon size={14} weight="fill" />
            ไม่มา
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => onFollowUp(id)}
        className="flex cursor-pointer items-center gap-1 text-[12.5px] font-medium text-primary-action hover:underline"
      >
        <NotePencilIcon size={14} />
        ติดตามผล
      </button>
    </div>
  );
}
