"use client";

/**
 * Pick who a product's Proposal goes to.
 *
 * Modelled on the campaign `ShareDialog` (`promotions/[id]/ShareDialog`), which
 * answers the same question for a campaign's artwork: tick the clients, send
 * once. The two differences are what the desks differ on:
 *
 * - **The roster is the whole book**, not a campaign's eligibility list. Every
 *   client can be offered a product.
 * - **No readiness gate.** A proposal is a document; the four checks
 *   (`ClientReadiness`) gate a *booking*, and applying them here would refuse
 *   to show a client the thing that would make them go and complete them.
 *
 * Each row says where that client already stands on this product, read off the
 * log and the bookings (`proposalOutcome`) — the one thing that stops an IC
 * re-pitching someone who has already bought.
 *
 * **Two steps.** Who, then how: the clients first, then the channels it goes
 * down (`proposal-channels`). YSInvest is always on and cannot be unticked;
 * Email, LINE and Voice AI are added per send, as many as the IC wants.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * The send writes a {@link ProposalLog} and delivers nothing. There is no mail
 * service and no app push behind it; the dialog says so rather than implying a
 * document has landed. See `sendProposal` in `contexts/orders-context`.
 */

import { useMemo, useState } from "react";
import { Avatar, Button, Checkbox, Tag } from "@sarunyu/system-one";
import { CaretDownIcon, DevicesIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { TierBadge } from "@/components/ui/tier-badge";
import { usePrivacy } from "@/contexts/privacy-context";
import { useOrders } from "@/contexts/orders-context";
import { useClients } from "@/hooks/use-api";
import { getInitials } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type { OrderBook, ProposalChannel } from "@/types/domain";
import {
  DEFAULT_PROPOSAL_CHANNELS,
  PROPOSAL_CHANNEL_META,
  PROPOSAL_CHANNEL_ORDER,
} from "./proposal-channels";
import { ProposalChip } from "./ProposalChip";
import {
  PROPOSAL_OUTCOME_LABEL,
  PROPOSAL_OUTCOME_VARIANT,
  latestProposalFor,
  proposalOutcome,
} from "./order-proposals";

/**
 * What a Proposal can be about — any product the IC can put in front of a
 * client. A `BookableProduct` is one as it stands; a mutual fund or a stock,
 * which are offered but never booked through the portal, passes the same three
 * fields plus what its documents are called.
 */
export type ProposalSubject = {
  /** Namespaced for products with no book (`fund-…`, `stock-…`), so a proposal
   *  on one can never be read as one on a structured product's id. */
  id: string;
  /** How it names itself — an underlying, a fund code, a ticker. */
  underlying: string;
  /** A second word beside the name, where the product has one (a coupon). */
  coupon?: string;
  /** What goes out. Defaults to a structured product's two documents. */
  documents?: string;
};

export function SendProposalDialog({
  open,
  onOpenChange,
  product,
  book,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProposalSubject;
  /** For reading each client's standing. `null` while the book loads, and
   *  always for a product that is offered but never booked. */
  book: OrderBook | null;
  onConfirm: (clientIds: string[], channels: ProposalChannel[]) => void;
}) {
  const clients = useClients();
  const { proposals } = useOrders();
  const { isPrivate } = usePrivacy();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"clients" | "channels">("clients");
  const [showRecipients, setShowRecipients] = useState(false);
  const [channels, setChannels] = useState<Set<ProposalChannel>>(
    () => new Set(DEFAULT_PROPOSAL_CHANNELS),
  );

  /**
   * Closing clears the ticks, so the next product never inherits them.
   *
   * On the way out rather than on the way in, for the reason `ShareDialog`
   * spells out: resetting when `open` turns true is a `setState` inside an
   * effect and costs a second render pass.
   */
  const setOpen = (next: boolean) => {
    if (!next) {
      setPicked(new Set());
      setStep("clients");
      setShowRecipients(false);
      setChannels(new Set(DEFAULT_PROPOSAL_CHANNELS));
    }
    onOpenChange(next);
  };

  /** Each client, with where they already stand on this product. */
  const rows = useMemo(
    () =>
      clients.map((client) => {
        const sent = latestProposalFor(proposals, product.id, client.id);
        return {
          client,
          sent,
          outcome: sent && book ? proposalOutcome(sent, book) : null,
        };
      }),
    [clients, proposals, product.id, book],
  );

  const allPicked = rows.length > 0 && picked.size === rows.length;
  const allChannels = channels.size === PROPOSAL_CHANNEL_ORDER.length;
  /** Who it is going to, for step two — in the roster's order. */
  const recipients = rows
    .filter((r) => picked.has(r.client.id))
    .map((r) => ({ id: r.client.id, name: maskName(r.client.name, isPrivate) }));

  /** Dropping the last one leaves nothing to send — back to choosing. */
  const removeRecipient = (id: string) => {
    toggle(id, false);
    if (picked.size === 1 && picked.has(id)) setStep("clients");
  };

  const toggleChannel = (c: ProposalChannel, next: boolean) =>
    setChannels((prev) => {
      if (PROPOSAL_CHANNEL_META[c].required) return prev;
      const copy = new Set(prev);
      if (next) copy.add(c);
      else copy.delete(c);
      return copy;
    });

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
      title="ส่ง Proposal ให้ลูกค้า"
      onBack={step === "channels" ? () => setStep("clients") : undefined}
      closeOnBackdrop
      desktopContentClassName="w-[460px] max-w-full"
    >
      <div className="flex flex-col gap-4 pt-1">
        {/* What is going out, named before who it goes to — the IC is about to
            put this in front of a client and has to know which document. */}
        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
          <DevicesIcon
            size={16}
            weight="fill"
            className="mt-0.5 shrink-0 text-primary-action"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-label font-semibold text-foreground">
              {product.underlying}
              {product.coupon ? ` ${product.coupon}` : ""}
            </span>
            <span className="text-meta leading-snug text-muted-foreground">
              {product.documents ?? "Presentation PDF และชุดเอกสาร"}
            </span>
          </div>
        </div>

        {/* Who it is going to, named — step one's choice carried into step two
            so the IC confirms people, not a count. Folded to one line by
            default ("ส่งถึง N คน"); unfolded it is
            every name, in a box that scrolls past three rows so a long list
            never pushes the channels off screen. */}
        {step === "channels" && recipients.length > 0 && (
          <div className="flex flex-col overflow-hidden rounded-xl border border-border/60">
            {/* The whole row is the toggle. Only the row, not the box: the
                unfolded chips carry their own ✕ buttons, and a button cannot
                sit inside another. */}
            <button
              type="button"
              onClick={() => setShowRecipients((v) => !v)}
              aria-expanded={showRecipients}
              aria-label={showRecipients ? "ซ่อนรายชื่อ" : `ดูรายชื่อทั้งหมด ${recipients.length} คน`}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/40"
            >
              <span className="min-w-0 flex-1 text-label text-muted-foreground">
                ส่งถึง{" "}
                <span className="font-semibold text-foreground">{recipients.length} คน</span>
              </span>
              <CaretDownIcon
                size={14}
                weight="bold"
                className={`shrink-0 text-muted-foreground transition-transform ${showRecipients ? "rotate-180" : ""}`}
              />
            </button>
            {showRecipients && (
              <div className="mx-3 mb-2 flex max-h-[88px] flex-wrap gap-1.5 overflow-y-auto border-t border-border/60 pt-2">
                {recipients.map(({ id, name }) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-muted/50 py-0.5 pl-2 pr-1 text-meta font-medium text-foreground"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeRecipient(id)}
                      aria-label={`เอา ${name} ออก`}
                      className="flex size-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-black/10 hover:text-foreground"
                    >
                      <XIcon size={10} weight="bold" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "clients" && rows.length > 0 && (
          <div className="-mb-1 flex items-center justify-between pl-1">
            <span className="text-label font-semibold text-muted-foreground">
              รายชื่อลูกค้า
            </span>
            <Button
              variant="plain"
              size="sm"
              onClick={() =>
                setPicked(
                  allPicked ? new Set() : new Set(rows.map((r) => r.client.id)),
                )
              }
            >
              {allPicked ? "ล้างที่เลือก" : "เลือกทั้งหมด"}
            </Button>
          </div>
        )}

        {step === "clients" && (
          <div className="-mx-1 flex max-h-[calc(var(--vh)*46)] flex-col gap-2 overflow-y-auto px-1 py-0.5">
            {rows.map(({ client, sent, outcome }) => {
              const name = maskName(client.name, isPrivate);
              const checked = picked.has(client.id);
              return (
                <label
                  key={client.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                    checked
                      ? "border-primary-action/40 bg-primary-action-light"
                      : "border-border/60 hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onChange={(next) => toggle(client.id, next)}
                  />
                  <Avatar type="text" initials={getInitials(name)} size="s" />
                  <span className="min-w-0 flex-1 truncate text-body-sm font-semibold text-foreground">
                    {name}
                  </span>
                  {/* Where they already stand. Nothing for a client never
                    offered this — an empty row reads as "ยังไม่ส่ง" without
                    a tag saying so, and a tag on every row would make the two
                    that matter hard to pick out. */}
                  {/* No book to read an outcome off — a fund or a stock — so
                    only that it went. */}
                  {sent && !book ? (
                    <ProposalChip />
                  ) : outcome === "open" ? (
                    <ProposalChip label={PROPOSAL_OUTCOME_LABEL.open} />
                  ) : outcome ? (
                    <Tag
                      text={PROPOSAL_OUTCOME_LABEL[outcome]}
                      variant={PROPOSAL_OUTCOME_VARIANT[outcome]}
                      size="small"
                    />
                  ) : null}
                  <TierBadge
                    tier={client.membershipTier}
                    className="shrink-0"
                  />
                </label>
              );
            })}
          </div>
        )}

        {step === "channels" && (
          <div className="flex flex-col gap-2">
            <div className="-mb-1 flex items-center justify-between pl-1">
              <span className="text-label font-semibold text-muted-foreground">
                ช่องทางการส่ง
              </span>
              <Button
                variant="plain"
                size="sm"
                onClick={() =>
                  setChannels(
                    new Set(allChannels ? DEFAULT_PROPOSAL_CHANNELS : PROPOSAL_CHANNEL_ORDER),
                  )
                }
              >
                {allChannels ? "ล้างที่เลือก" : "เลือกทั้งหมด"}
              </Button>
            </div>
            {PROPOSAL_CHANNEL_ORDER.map((c) => {
              const { label, hint, Icon, color, required } =
                PROPOSAL_CHANNEL_META[c];
              const checked = channels.has(c);
              return (
                <label
                  key={c}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                    required ? "cursor-default" : "cursor-pointer"
                  } ${
                    checked
                      ? "border-primary-action/40 bg-primary-action-light"
                      : "border-border/60 hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    disabled={required}
                    onChange={(next) => toggleChannel(c, next)}
                  />
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white"
                    style={{ color }}
                  >
                    <Icon size={18} weight="fill" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body-sm font-semibold text-foreground">
                      {label}
                    </span>
                    <span className="truncate text-meta text-muted-foreground">
                      {hint}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {/* Said plainly, because it is not true yet: the record is written,
              nothing is delivered. Same wording bargain `ShareDialog` makes. */}
          {step === "clients" ? (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={picked.size === 0}
              onClick={() => setStep("channels")}
            >
              {picked.size > 0
                ? `ถัดไป · เลือกแล้ว ${picked.size} คน`
                : "ถัดไป"}
            </Button>
          ) : (
            <>
              {/* Said plainly, because it is not true yet: the record is
                  written, nothing is delivered. */}
              <p className="flex items-start gap-1.5 text-label leading-snug text-muted-foreground">
                <PaperPlaneTiltIcon size={14} className="mt-0.5 shrink-0" />
                ระบบหลังบ้านจะส่งเอกสารผ่านช่องทางที่เลือก
                และบันทึกการส่งไว้เพื่อวัดผล
              </p>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                leftIcon={<PaperPlaneTiltIcon size={16} weight="fill" />}
                onClick={() => {
                  onConfirm(
                    [...picked],
                    PROPOSAL_CHANNEL_ORDER.filter((c) => channels.has(c)),
                  );
                  setOpen(false);
                }}
              >
                {picked.size > 1
                  ? `ส่ง Proposal ${picked.size} คน`
                  : "ส่ง Proposal"}
              </Button>
            </>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
