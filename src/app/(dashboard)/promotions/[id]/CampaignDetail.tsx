"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarBlankIcon,
  ClockIcon,
  LinkSimpleIcon,
  MapPinIcon,
  UsersThreeIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react";
import { Button, Card, Tag, Toaster } from "@sarunyu/system-one";
import { useSectionBack } from "@/hooks/use-section-back";
import { useToasts } from "@/hooks/use-toasts";
import { useClients } from "@/hooks/use-api";
import { useCampaign } from "@/hooks/use-campaigns";
import { useCampaignStore } from "@/contexts/campaigns-context";
import { useNotes } from "@/contexts/notes-context";
import { NOTE_AUTHOR } from "../../notes/note-constants";
import { todayDateKey } from "../../calendar/calendar-grid";
import type { CampaignClientStatus, RsvpStatus } from "@/types/domain";
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
  TYPE_LABEL,
} from "../campaign-data";
import { CampaignDetailSkeleton } from "./CampaignDetailSkeleton";
import { EligibleClientsTable } from "./EligibleClientsTable";
import { EventBody } from "./EventBody";
import { MaterialsCard } from "./MaterialsCard";
import { PromotionBody } from "./PromotionBody";
import { RsvpTable } from "./RsvpTable";

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
  const searchParams = useSearchParams();
  const { data: campaign, isLoading } = useCampaign(id);
  const clients = useClients();
  const {
    campaignClients,
    rsvps,
    shareLogs,
    shareMaterial,
    setClientStatus,
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

  /** The approved material a bulk share would send. */
  const [materialId, setMaterialId] = useState<string | null>(null);
  const firstApproved = campaign?.materials.find((m) => m.approved)?.id ?? null;
  const selectedMaterial = materialId ?? firstApproved;

  const rows = useMemo(
    () =>
      campaign
        ? campaignClientRows(campaign, campaignClients, rsvps, clients)
        : [],
    [campaign, campaignClients, rsvps, clients],
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const share = useCallback(
    async (clientIds: string[], withMaterial?: string) => {
      const chosen = withMaterial ?? selectedMaterial;
      if (!campaign || !chosen || clientIds.length === 0) return;
      try {
        const written = await shareMaterial({
          campaignId: campaign.id,
          clientIds,
          materialId: chosen,
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
    [campaign, selectedMaterial, shareMaterial, addToast],
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

  const changeStatus = useCallback(
    async (clientId: string, status: CampaignClientStatus) => {
      if (!campaign) return;
      await setClientStatus(campaign.id, clientId, status);
    },
    [campaign, setClientStatus],
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

  // ── Deep links from the list page's card actions ──────────────────────────

  const focus = searchParams.get("focus");
  const materialsRef = useRef<HTMLDivElement>(null);
  const clientsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focus || isLoading) return;
    const target = focus === "share" ? materialsRef.current : clientsRef.current;
    // Next paint: the section has to exist and be laid out before it can be
    // scrolled to, and on a cold load this effect runs with an empty body.
    const frame = requestAnimationFrame(() =>
      target?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [focus, isLoading]);

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

  const shareDisabledReason = ended
    ? "แคมเปญนี้หมดเขตแล้ว"
    : selectedMaterial === null
      ? "แคมเปญนี้ยังไม่มีสื่อที่อนุมัติให้ส่งได้"
      : null;

  return (
    <>
      <div className="flex flex-col gap-6 pb-12">
        {/* Mobile breadcrumb comes from the layout, above this content. */}
        <Button
          variant="plain"
          size="sm"
          leftIcon={<ArrowLeftIcon size={16} />}
          onClick={goBack}
          className="hidden self-start xl:inline-flex"
        >
          กลับ
        </Button>

        {/* ── Banner ─────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG cover; the image optimizer rejects SVG */}
          <img
            src={campaign.cover}
            alt=""
            className={`h-[180px] w-full object-cover sm:h-[240px] xl:h-[280px] ${
              ended ? "opacity-50 grayscale" : ""
            }`}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent"
          />

          <div className="absolute inset-0 flex flex-col justify-end gap-2.5 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <Tag
                text={TYPE_LABEL[campaign.type]}
                variant={isEvent ? "lime" : "blue"}
                size="small"
              />
              {ended ? (
                <Tag text="หมดเขต" variant="gray" size="small" />
              ) : (
                <>
                  {countdown && <Tag text={countdown} variant="red" size="small" icon />}
                  {status === "upcoming" && (
                    <Tag text="เร็ว ๆ นี้" variant="gray" size="small" />
                  )}
                  {open === 0 && <Tag text="ที่นั่งเต็ม" variant="yellow" size="small" />}
                </>
              )}
            </div>

            <h1 className="max-w-3xl text-[20px] font-bold leading-tight text-white sm:text-[26px]">
              {campaign.title}
            </h1>
            <p className="max-w-2xl text-[13px] leading-snug text-white/80 sm:text-[14.5px]">
              {campaign.summary}
            </p>
          </div>

        </div>

        {/* ── Meta strip ─────────────────────────────────────────────────── */}
        <Card variant="default" className="gap-0 p-0!">
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4">
            <MetaCell
              icon={<CalendarBlankIcon size={17} weight="fill" />}
              label={isEvent ? "วันจัดงาน" : "ระยะเวลาแคมเปญ"}
              value={
                isEvent && campaign.eventDate
                  ? thaiDay(campaign.eventDate)
                  : `${thaiDay(campaign.startDate)} – ${thaiDay(campaign.endDate)}`
              }
            />
            <MetaCell
              icon={<ClockIcon size={17} weight="fill" />}
              label={isEvent ? "ปิดรับลงทะเบียน" : "สถานะ"}
              value={isEvent ? thaiDay(campaign.endDate) : statusLine(status, campaign.endDate, today)}
            />
            {isEvent ? (
              <MetaCell
                icon={
                  campaign.format === "online" ? (
                    <VideoCameraIcon size={17} weight="fill" />
                  ) : (
                    <MapPinIcon size={17} weight="fill" />
                  )
                }
                label={campaign.format ? FORMAT_LABEL[campaign.format] : "สถานที่"}
                value={campaign.venue ?? "—"}
              />
            ) : (
              <MetaCell
                icon={<UsersThreeIcon size={17} weight="fill" />}
                label="กลุ่มลูกค้า"
                value={campaign.segments.map((s) => SEGMENT_LABEL[s]).join(" · ")}
              />
            )}
            <MetaCell
              icon={<UsersThreeIcon size={17} weight="fill" />}
              label={isEvent ? "ที่นั่ง" : "สินทรัพย์"}
              value={
                isEvent
                  ? campaign.seatsTotal
                    ? `เหลือ ${open ?? 0} จาก ${campaign.seatsTotal} ที่นั่ง`
                    : "ไม่จำกัดที่นั่ง"
                  : campaign.products.map((p) => PRODUCT_LABEL[p]).join(" · ")
              }
            />
          </div>
        </Card>

        {isEvent && campaign.format === "online" && campaign.joinUrl && !past && (
          <a
            href={campaign.joinUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit items-center gap-2 rounded-xl border border-border bg-primary-action-light px-4 py-2.5 text-[13px] font-semibold text-primary-action no-underline transition-colors hover:bg-[rgba(10,110,231,0.16)]"
          >
            <LinkSimpleIcon size={16} weight="bold" />
            ลิงก์เข้าร่วมงาน
          </a>
        )}

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div
          className="flex flex-col gap-8 lg:grid lg:gap-8"
          style={{ gridTemplateColumns: "minmax(0, 1fr) 360px", alignItems: "start" }}
        >
          <div className="flex min-w-0 flex-col gap-8">
            {isEvent ? (
              <EventBody campaign={campaign} />
            ) : (
              <PromotionBody campaign={campaign} />
            )}

            <div ref={clientsRef} className="scroll-mt-6">
              {isEvent ? (
                <RsvpTable
                  rows={rows}
                  seatsLeft={open}
                  isPast={past}
                  onRegister={register}
                  onSetRsvp={changeRsvp}
                  onFollowUp={followUp}
                />
              ) : (
                <EligibleClientsTable
                  rows={rows}
                  campaignSegments={campaign.segments}
                  shareDisabledReason={shareDisabledReason}
                  onShare={(ids) => void share(ids)}
                  onSetStatus={(clientId, next) => void changeStatus(clientId, next)}
                />
              )}
            </div>

            <ShareLogCard count={shareLogs.filter((l) => l.campaignId === campaign.id).length} />
          </div>

          {/* Materials sit in the sidebar on desktop and inline on tablet and
              below — the same arrangement an insight's PDF panel uses. */}
          <div ref={materialsRef} className="scroll-mt-6 lg:sticky lg:top-6">
            <Card variant="default" className="gap-4">
              <MaterialsCard
                materials={campaign.materials}
                selectedId={selectedMaterial}
                closed={ended}
                onSelect={setMaterialId}
                onShareOne={(mid) => {
                  setMaterialId(mid);
                  clientsRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                  addToast({
                    status: "information",
                    message: "เลือกสื่อแล้ว — เลือกลูกค้าด้านล่างเพื่อส่ง",
                  });
                }}
                onCopied={(label) =>
                  addToast({ status: "success", message: `คัดลอก "${label}" แล้ว` })
                }
              />
            </Card>
          </div>
        </div>
      </div>

      <Toaster items={toasts} onRemove={removeToast} />
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
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 p-4">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-[13px] font-medium leading-snug text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * The compliance trail, as a count rather than a list.
 *
 * Every share writes a `ShareLog`, and saying so where the sharing happens is
 * what makes the rule visible to the IC. The rows themselves belong to
 * compliance's own surface, not to the IC's campaign page, so this stops at the
 * number.
 */
function ShareLogCard({ count }: { count: number }) {
  return (
    <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-[12.5px] leading-snug text-muted-foreground">
      การส่งสื่อทุกครั้งจะถูกบันทึกไว้เพื่อการตรวจสอบ — แคมเปญนี้มีประวัติการส่งแล้ว{" "}
      <span className="font-semibold tabular-nums text-foreground">{count}</span>{" "}
      รายการ
    </p>
  );
}
