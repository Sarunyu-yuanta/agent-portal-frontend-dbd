"use client";

import {
  CheckCircleIcon,
  LinkSimpleIcon,
  MapPinIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react";
import { Tag } from "@sarunyu/system-one";
import type { Campaign } from "@/types/domain";
import { PRODUCT_LABEL, SEGMENT_LABEL, thaiDay } from "../campaign-data";
import { Disclaimer } from "./PromotionBody";

/**
 * What happens on the day, who is speaking, and where.
 *
 * The agenda leads rather than the description: an IC deciding whether to put a
 * client's evening on the line is asking "what will they actually get", and the
 * session titles answer that better than a paragraph does. Everything a
 * promotion also has — conditions, terms, disclaimer — keeps its shape and its
 * order from `PromotionBody`, so the two detail pages read as one surface.
 */
export function EventBody({ campaign }: { campaign: Campaign }) {
  const online = campaign.format === "online";

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="type-subtitle-1 font-bold text-foreground">
          เกี่ยวกับงานนี้
        </h2>
        <p className="text-[14px] leading-relaxed text-foreground">
          {campaign.summary}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {campaign.products.map((product) => (
            <Tag key={product} text={PRODUCT_LABEL[product]} variant="blue" size="small" />
          ))}
          {campaign.segments.map((segment) => (
            <Tag key={segment} text={SEGMENT_LABEL[segment]} variant="gray" size="small" />
          ))}
        </div>
      </section>

      {campaign.agenda && campaign.agenda.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="type-subtitle-1 font-bold text-foreground">กำหนดการ</h2>
          <div className="flex flex-col">
            {campaign.agenda.map((item, index) => (
              <div
                key={`${item.time}-${item.title}`}
                className="flex gap-3 sm:gap-4"
              >
                {/* Timeline rail: a dot per session, joined by a line that
                    stops at the last one rather than trailing into nothing. */}
                <div className="flex w-[82px] shrink-0 flex-col items-end pt-0.5 sm:w-[104px]">
                  <span className="text-[12.5px] font-semibold tabular-nums text-accent-orange">
                    {item.time}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary-action" />
                  {index < (campaign.agenda?.length ?? 0) - 1 && (
                    <span className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-5">
                  <p className="text-[13.5px] font-semibold leading-snug text-foreground">
                    {item.title}
                  </p>
                  {item.speaker && (
                    <p className="text-[12.5px] text-muted-foreground">
                      โดย {item.speaker}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {campaign.speakers && campaign.speakers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="type-subtitle-1 font-bold text-foreground">วิทยากร</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {campaign.speakers.map((speaker) => (
              <div
                key={speaker.name}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
              >
                {speaker.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- fixed-size headshot, no responsive sizes needed
                  <img
                    src={speaker.photo}
                    alt={speaker.name}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--fill-p1-100)] text-[15px] font-bold text-[var(--fill-p1-600)]"
                  >
                    {/* The first character of the name as it is written — Thai
                        names have no Western initials to take, and a two-letter
                        abbreviation of one reads as nonsense. */}
                    {speaker.name.replace(/^(ดร\.|คุณ|นาย|นาง|นางสาว)\s*/, "").charAt(0)}
                  </span>
                )}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-[13.5px] font-bold leading-snug text-foreground">
                    {speaker.name}
                  </p>
                  <p className="text-[12px] leading-snug text-muted-foreground">
                    {speaker.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="type-subtitle-1 font-bold text-foreground">
          สถานที่และการเข้าร่วม
        </h2>
        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]"
            >
              {online ? (
                <VideoCameraIcon size={17} weight="fill" />
              ) : (
                <MapPinIcon size={17} weight="fill" />
              )}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-[13.5px] font-semibold text-foreground">
                {campaign.venue ?? "—"}
              </p>
              <p className="text-[12.5px] text-muted-foreground">
                {campaign.eventDate ? thaiDay(campaign.eventDate) : "—"}
                {campaign.seatsTotal
                  ? ` · ที่นั่งทั้งหมด ${campaign.seatsTotal} ที่นั่ง`
                  : ""}
              </p>
            </div>
          </div>

          {online && campaign.joinUrl && (
            <a
              href={campaign.joinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 break-all text-[12.5px] font-medium text-primary-action hover:underline"
            >
              <LinkSimpleIcon size={14} weight="bold" className="shrink-0" />
              {campaign.joinUrl}
            </a>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="type-subtitle-1 font-bold text-foreground">
          เงื่อนไขการเข้าร่วม
        </h2>
        <ul className="flex list-none flex-col gap-2.5 p-0">
          {campaign.conditions.map((condition) => (
            <li key={condition} className="flex items-start gap-2.5">
              <CheckCircleIcon
                size={18}
                weight="fill"
                className="mt-0.5 shrink-0 text-primary-action"
              />
              <span className="text-[14px] leading-relaxed text-foreground">
                {condition}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="type-subtitle-1 font-bold text-foreground">
          ข้อกำหนดและเงื่อนไข
        </h2>
        <ol className="flex list-none flex-col gap-2 p-0">
          {campaign.terms.map((term, index) => (
            <li key={term} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <span className="text-[13.5px] leading-relaxed text-foreground">
                {term}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Disclaimer text={campaign.disclaimer} />
    </div>
  );
}
