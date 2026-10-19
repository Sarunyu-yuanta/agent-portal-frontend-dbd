"use client";

import { Fragment, Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarBlankIcon,
  ClockIcon,
  LinkSimpleIcon,
  MapPinIcon,
  PaperPlaneTiltIcon,
  UsersThreeIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react";
import { Button, Tag, Toaster } from "@sarunyu/system-one";
import { useSectionBack } from "@/hooks/use-section-back";
import { useToasts } from "@/hooks/use-toasts";
import { useClients } from "@/hooks/use-api";
import { useCampaign } from "@/hooks/use-campaigns";
import { useCampaignStore } from "@/contexts/campaigns-context";
import { useNotes } from "@/contexts/notes-context";
import { NOTE_AUTHOR } from "../../notes/note-constants";
import { todayDateKey } from "../../calendar/calendar-grid";
import type { RsvpStatus } from "@/types/domain";
import {
  campaignClientRows,
  campaignStatus,
  countdownLabel,
  daysUntil,
  FORMAT_LABEL,
  isPastEvent,
  PRODUCT_LABEL,
  SEGMENT_LABEL,
  thaiDay,
} from "../campaign-data";
import { CampaignDetailSkeleton } from "./CampaignDetailSkeleton";
import { EventBody } from "./EventBody";
import { PromotionBody } from "./PromotionBody";
import { RsvpTable } from "./RsvpTable";
import { ShareDialog } from "./ShareDialog";

/**
 * One campaign, in full.
 *
 * A routed page rather than a drawer, following `/insights/[id]`: the content
 * runs to terms, a materials list and a client table, which is more than a side
 * panel can hold, and a campaign is a thing an IC sends links to.
 *
 * The two kinds share this shell — back button, banner, meta strip, conditions,
 * terms, disclaimer — and differ in the middle: a promotion's body is its offer
 * and its approved artwork, an event's is its agenda, venue and seats. The
 * client table differs with them, because "who can I send this to" and "who is
 * coming" are different tables of the same people.
 */
export function CampaignDetail({ id }: { id: string }) {
  return (
    <Suspense fallback={<CampaignDetailSkeleton />}>
      <CampaignDetailInner id={id} />
    </Suspense>
  );
}

function CampaignDetailInner({ id }: { id: string }) {
  const { data: campaign, isLoading } = useCampaign(id);
  const clients = useClients();
  const {
    campaignClients,
    rsvps,
    shareMaterial,
    registerClients,
    setRsvpStatus,
    seatsLeft,
  } = useCampaignStore();
  const { addNote } = useNotes();
  const { toasts, addToast, removeToast } = useToasts();
  // Called before any early return — a missing campaign must not skip a hook.
  // No fallback override: `/promotions/` is registered in `sectionRoot`, so a
  // cold entry already lands on the list.
  const goBack = useSectionBack();

  const todayKey = todayDateKey();
  const today = useMemo(() => new Date(todayKey), [todayKey]);

  const [shareOpen, setShareOpen] = useState(false);

  /**
   * What a share actually sends.
   *
   * The page no longer lists the materials, so there is nothing for the IC to
   * choose between — but a `ShareLog` still records a material and a version,
   * because "which version went out" is the question that log exists to
   * answer. The first approved material stands in for the campaign's pack.
   *
   * `undefined` means nothing is approved yet, which is the one case where
   * sharing has to be refused rather than silently logged against nothing.
   */
  const shareable = campaign?.materials.find((m) => m.approved) ?? null;

  const rows = useMemo(
    () =>
      campaign
        ? campaignClientRows(campaign, campaignClients, rsvps, clients)
        : [],
    [campaign, campaignClients, rsvps, clients],
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Confirmed from the share dialog: this material, to these clients. */
  const share = useCallback(
    async (materialId: string, clientIds: string[]) => {
      if (!campaign || clientIds.length === 0) return;
      try {
        const written = await shareMaterial({
          campaignId: campaign.id,
          clientIds,
          materialId,
        });
        addToast({
          status: written.length > 0 ? "success" : "warning",
          message:
            written.length > 0
              ? `ส่งให้ลูกค้า ${written.length} รายแล้ว และบันทึกการส่งเรียบร้อย`
              : "ไม่มีลูกค้าที่ส่งได้ในรายการที่เลือก",
        });
      } catch (error) {
        addToast({
          status: "critical",
          message:
            error instanceof Error ? error.message : "ส่งไม่สำเร็จ กรุณาลองใหม่",
        });
      }
    },
    [campaign, shareMaterial, addToast],
  );

  const register = useCallback(
    async (clientIds: string[]) => {
      if (!campaign || clientIds.length === 0) return;
      try {
        const added = await registerClients({
          campaignId: campaign.id,
          clientIds,
        });
        addToast({
          status: "success",
          message: `ลงทะเบียนให้ลูกค้า ${added.length} รายแล้ว`,
        });
      } catch (error) {
        addToast({
          status: "critical",
          message:
            error instanceof Error
              ? error.message
              : "ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่",
        });
      }
    },
    [campaign, registerClients, addToast],
  );

  const changeRsvp = useCallback(
    async (clientId: string, status: RsvpStatus) => {
      if (!campaign) return;
      await setRsvpStatus(campaign.id, clientId, status);
    },
    [campaign, setRsvpStatus],
  );

  /**
   * Post-event follow-up.
   *
   * Writes a Note rather than a Call Log entry. The spec offers either, and
   * only one of them is writable: `data/call-log-data.ts` is a static map with
   * no mutator and no store behind it, while Notes has a provider, survives
   * navigation, and already shows up on the client's own profile and in the
   * Calendar — which is where a follow-up actually needs to resurface.
   */
  const followUp = useCallback(
    async (clientId: string) => {
      if (!campaign) return;
      const client = clients.find((c) => c.id === clientId);
      await addNote({
        clientIds: [clientId],
        title: `ติดตามผลหลังงาน: ${campaign.title}`,
        body: `${client?.name ?? "ลูกค้า"} เข้าร่วมงาน ${campaign.title} เมื่อ ${
          campaign.eventDate ? thaiDay(campaign.eventDate) : "ที่ผ่านมา"
        }\n\nสิ่งที่ต้องติดตาม:\n- `,
        author: NOTE_AUTHOR,
        reminderAt: null,
        reminderDone: false,
      });
      addToast({ status: "success", message: "สร้างโน้ตติดตามผลแล้ว ดูได้ที่ Notes" });
    },
    [campaign, clients, addNote, addToast],
  );

  if (isLoading) return <CampaignDetailSkeleton />;

  if (!campaign) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="type-subtitle-1 text-foreground">ไม่พบแคมเปญนี้</p>
        <Link
          href="/promotions"
          className="text-[13px] text-primary-action hover:underline"
        >
          กลับไปหน้า Promotion/Events
        </Link>
      </div>
    );
  }

  const status = campaignStatus(campaign, today);
  const ended = status === "ended";
  const countdown = countdownLabel(campaign, today);
  const isEvent = campaign.type === "event";
  const past = isPastEvent(campaign, today);
  const open = seatsLeft(campaign.id);

  const metaItems: MetaItem[] = [
    {
      icon: <CalendarBlankIcon size={17} weight="fill" />,
      label: isEvent ? "วันจัดงาน" : "ระยะเวลาแคมเปญ",
      labelHint: countdown ?? undefined,
      value:
        isEvent && campaign.eventDate
          ? thaiDay(campaign.eventDate)
          : `${thaiDay(campaign.startDate)} – ${thaiDay(campaign.endDate)}`,
    },
    {
      icon: <ClockIcon size={17} weight="fill" />,
      label: isEvent ? "ปิดรับลงทะเบียน" : "สถานะ",
      value: isEvent
        ? thaiDay(campaign.endDate)
        : statusLine(status, campaign.endDate, today),
    },
    isEvent
      ? {
          icon:
            campaign.format === "online" ? (
              <VideoCameraIcon size={17} weight="fill" />
            ) : (
              <MapPinIcon size={17} weight="fill" />
            ),
          label: campaign.format ? FORMAT_LABEL[campaign.format] : "สถานที่",
          value: campaign.venue ?? "—",
        }
      : {
          icon: <UsersThreeIcon size={17} weight="fill" />,
          label: "กลุ่มลูกค้า",
          value: campaign.segments.map((s) => SEGMENT_LABEL[s]).join(" · "),
        },
    {
      icon: <UsersThreeIcon size={17} weight="fill" />,
      label: isEvent ? "ที่นั่ง" : "สินทรัพย์",
      value: isEvent
        ? campaign.seatsTotal
          ? `เหลือ ${open ?? 0} จาก ${campaign.seatsTotal} ที่นั่ง`
          : "ไม่จำกัดที่นั่ง"
        : campaign.products.map((p) => PRODUCT_LABEL[p]).join(" · "),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-5 pb-12 sm:gap-6">
        {/* Mobile breadcrumb comes from the layout, above this content. */}
        <Button
          variant="plain"
          size="sm"
          leftIcon={<ArrowLeftIcon size={16} />}
          onClick={goBack}
          className="hidden self-start rounded-full xl:inline-flex"
        >
          กลับ
        </Button>

        {/* Banner + meta share one frame — flush join, radius from the strip below. */}
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-white shadow-[0_8px_32px_-12px_rgba(15,23,42,0.35)]">
          <div className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG cover; the image optimizer rejects SVG */}
            <img
              src={campaign.cover}
              alt=""
              className={`h-[200px] w-full object-cover sm:h-[260px] xl:h-[300px] ${
                ended ? "opacity-50 grayscale" : ""
              }`}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10"
            />
            <div
              aria-hidden
              className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-20 left-1/4 size-40 rounded-full bg-primary-action/20 blur-3xl"
            />

            <div className="absolute inset-0 flex flex-col justify-end gap-3.5 p-5 sm:gap-4 sm:p-7">
              {(ended || status === "upcoming" || open === 0) && (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                  {ended ? (
                    <Tag text="หมดเขต" variant="gray" size="small" />
                  ) : (
                    <>
                      {status === "upcoming" && (
                        <Tag text="เร็ว ๆ นี้" variant="gray" size="small" />
                      )}
                      {open === 0 && (
                        <Tag text="ที่นั่งเต็ม" variant="yellow" size="small" />
                      )}
                    </>
                  )}
                </div>
              )}

              <h1 className="max-w-3xl text-[22px] font-bold leading-[1.2] tracking-tight text-white sm:text-[28px] sm:leading-[1.15]">
                {campaign.title}
              </h1>
              <p className="max-w-2xl text-[13px] leading-relaxed text-white/75 sm:text-[15px]">
                {campaign.summary}
              </p>

              {/* The page's one action, on the banner so it is reachable
                  without scrolling past the terms. Gone once the campaign has
                  closed, and refused outright while nothing is approved —
                  there would be no version to log the send against. */}
              {!ended && (
                <div className="pt-1">
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<PaperPlaneTiltIcon size={16} weight="fill" />}
                    disabled={shareable === null}
                    onClick={() => setShareOpen(true)}
                  >
                    {shareable === null
                      ? "ยังไม่มีสื่อที่อนุมัติ"
                      : "แชร์ให้ลูกค้า"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <MetaStrip items={metaItems} attached />
        </div>

        {isEvent && campaign.format === "online" && campaign.joinUrl && !past && (
          <a
            href={campaign.joinUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit items-center gap-2 rounded-xl border border-primary-action/20 bg-primary-action-light px-4 py-2.5 text-[13px] font-semibold text-primary-action no-underline shadow-[0_2px_8px_-2px_rgba(10,110,231,0.25)] transition-all hover:border-primary-action/40 hover:bg-[rgba(10,110,231,0.16)]"
          >
            <LinkSimpleIcon size={16} weight="bold" />
            ลิงก์เข้าร่วมงาน
          </a>
        )}

        {/* ── Body ───────────────────────────────────────────────────────── */}
        {/* One column. The materials panel used to hold the right-hand track;
            with it gone there is nothing to put beside the body, and a 360px
            empty gutter is worse than full width. */}
        <div className="flex flex-col gap-5">
          {isEvent ? (
            <EventBody campaign={campaign} />
          ) : (
            <PromotionBody campaign={campaign} />
          )}

          {/* Events keep their table: registering someone, confirming a seat
              and marking attendance all happen on the row itself. A promotion
              has no such table any more — once picking clients moved into the
              share dialog, the list below it was the same names again with
              nothing to do to them. */}
          {isEvent && (
            <RsvpTable
              rows={rows}
              seatsLeft={open}
              isPast={past}
              onRegister={register}
              onSetRsvp={changeRsvp}
              onFollowUp={followUp}
            />
          )}
        </div>
      </div>

      {/* Who gets it. Which material is no longer asked — see `shareable`. */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        material={shareable}
        rows={rows}
        onConfirm={(clientIds) => {
          if (shareable) void share(shareable.id, clientIds);
        }}
      />

      <Toaster items={toasts} onRemove={removeToast} />
    </>
  );
}

type MetaItem = {
  icon: React.ReactNode;
  label: string;
  /** Shown in parentheses after the label — e.g. the ending-soon countdown. */
  labelHint?: string;
  value: string;
};

/**
 * One bordered frame, three layouts. Vertical rules are separate elements that
 * stretch with the row — cell borders were stopping short and read as a second
 * bottom edge.
 */
function MetaStrip({
  items,
  attached = false,
}: {
  items: MetaItem[];
  /** Sits flush under the banner inside a shared rounded frame. */
  attached?: boolean;
}) {
  const frame = attached
    ? "border-t border-border/50 bg-white"
    : "rounded-2xl border border-border/50 bg-white";

  return (
    <>
      <div className={`flex flex-col ${frame} sm:hidden`}>
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && <div aria-hidden className="h-px bg-border/50" />}
            <MetaCell {...item} />
          </Fragment>
        ))}
      </div>

      <div className={`hidden sm:grid sm:grid-cols-2 ${frame} xl:hidden`}>
        {items.map((item) => (
          <MetaCell key={item.label} {...item} />
        ))}
      </div>

      <div className={`hidden xl:flex xl:items-stretch ${frame}`}>
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && (
              <div aria-hidden className="w-px shrink-0 self-stretch bg-border/50" />
            )}
            <MetaCell {...item} className="min-w-0 flex-1" />
          </Fragment>
        ))}
      </div>
    </>
  );
}

function statusLine(
  status: ReturnType<typeof campaignStatus>,
  endDate: string,
  today: Date,
): string {
  if (status === "ended") return `หมดเขตเมื่อ ${thaiDay(endDate)}`;
  if (status === "upcoming") return "ยังไม่เริ่ม";
  const left = Math.max(0, daysUntil(endDate, today));
  return left === 0 ? "วันสุดท้ายวันนี้" : `เหลืออีก ${left} วัน`;
}

function MetaCell({
  icon,
  label,
  labelHint,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  labelHint?: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 p-4 sm:p-5 ${className}`}>
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--fill-p1-100)] to-white text-[var(--fill-p1-600)] ring-1 ring-[var(--fill-p1-200,rgba(10,110,231,0.12))]"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground">
          <span className="uppercase">{label}</span>
          {labelHint ? (
            <span className="normal-case font-medium text-destructive">
              {" "}
              ({labelHint})
            </span>
          ) : null}
        </p>
        <p className="text-[13.5px] font-semibold leading-snug text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

