"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Tag } from "@sarunyu/system-one";
import { ButtonLink } from "@/components/ui/button-link";
import type { Campaign } from "@/types/domain";
import {
  campaignDateLine,
  countdownLabel,
  TYPE_LABEL,
} from "./campaign-data";

/**
 * The one to three campaigns the firm is pushing this week.
 *
 * Scroll-snap rather than a transform-and-index carousel: the native scroller
 * gives swipe, keyboard, trackpad and momentum for free, and the dots and
 * carets are then just a view of `scrollLeft` instead of the source of truth.
 * The same reasoning — and the same overflow-watching effect — as
 * `components/ui/chip-scroller`, which is a chip strip and so not reusable
 * here, but is where this pattern in this app comes from.
 *
 * No autoplay. A banner that moves on its own steals the pointer from whoever
 * was about to click it, and these three are a shortlist, not a billboard.
 */
export function FeaturedCarousel({
  campaigns,
  today,
}: {
  campaigns: Campaign[];
  today: Date;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    // Rounding, not flooring: a fractional layout width means the final slide
    // often settles a pixel or two short of its own offset.
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure]);

  const goTo = (next: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(campaigns.length - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  if (campaigns.length === 0) return null;

  return (
    <div className="relative">
      {/* No rounding of its own — the hero block that wraps this rounds and
          clips both the carousel and the summary ribbon welded beneath it. */}
      <div
        ref={scrollRef}
        className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {campaigns.map((campaign) => (
          <FeaturedSlide key={campaign.id} campaign={campaign} today={today} />
        ))}
      </div>

      {campaigns.length > 1 && (
        <>
          {/* Carets are desktop-only: a touch device swipes, and two buttons
              floating over a banner on a phone cover the thing they point at. */}
          <CarouselArrow
            side="left"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          />
          <CarouselArrow
            side="right"
            disabled={index === campaigns.length - 1}
            onClick={() => goTo(index + 1)}
          />

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {campaigns.map((campaign, i) => (
              <button
                key={campaign.id}
                type="button"
                aria-label={`ไปที่แคมเปญที่ ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`h-1.5 cursor-pointer rounded-full transition-all duration-200 ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FeaturedSlide({
  campaign,
  today,
}: {
  campaign: Campaign;
  today: Date;
}) {
  const countdown = countdownLabel(campaign, today);
  const href = `/promotions/${campaign.id}`;

  return (
    <div className="relative w-full shrink-0 snap-start">
      {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG cover; the image optimizer rejects SVG */}
      <img
        src={campaign.cover}
        alt=""
        className="h-[240px] w-full object-cover sm:h-[300px] xl:h-[340px]"
      />
      {/* Left-weighted scrim rather than a flat overlay: the covers are drawn
          with their highlight top-left and their motif bottom-right, so the
          copy sits on the quiet half and the artwork still shows. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent"
      />

      <div className="absolute inset-0 flex flex-col justify-end gap-2.5 p-5 sm:p-7">
        {/* An eyebrow, not a heading — it names what the block is so the hero
            reads as an editorial slot rather than as decoration on a card. */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
          แคมเปญแนะนำ
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Tag
            text={TYPE_LABEL[campaign.type]}
            variant={campaign.type === "event" ? "lime" : "blue"}
            size="small"
          />
          {countdown && <Tag text={countdown} variant="red" size="small" icon />}
        </div>

        <Link href={href} className="no-underline">
          <h2 className="line-clamp-2 max-w-2xl text-[18px] font-bold leading-tight text-white sm:text-[24px]">
            {campaign.title}
          </h2>
        </Link>
        <p className="line-clamp-2 max-w-xl text-[12.5px] leading-snug text-white/80 sm:text-[14px]">
          {campaign.summary}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <ButtonLink href={href} variant="primary" size="md">
            ดูรายละเอียด
          </ButtonLink>
          <span className="text-[12.5px] font-medium text-white/85">
            {campaignDateLine(campaign)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CarouselArrow({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const isLeft = side === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isLeft ? "แคมเปญก่อนหน้า" : "แคมเปญถัดไป"}
      className={`absolute top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 shadow-sm transition-opacity lg:flex ${
        isLeft ? "left-3" : "right-3"
      } ${disabled ? "pointer-events-none opacity-0" : "cursor-pointer hover:bg-white"}`}
    >
      {isLeft ? <CaretLeftIcon size={15} /> : <CaretRightIcon size={15} />}
    </button>
  );
}
