"use client";

import { CheckCircleIcon } from "@phosphor-icons/react";
import { Tag } from "@sarunyu/system-one";
import type { Campaign } from "@/types/domain";
import { PRODUCT_LABEL, SEGMENT_LABEL } from "../campaign-data";

/**
 * What the offer is, who it is for, and the small print.
 *
 * Three levels of commitment, in order: the conditions an IC quotes on a call,
 * the terms they send, and the disclaimer that has to be on the page whether
 * anyone reads it or not. Keeping them apart is the point — collapsing them
 * into one block is how a condition the client needs to hear ends up in the
 * fine print nobody reads aloud.
 */
export function PromotionBody({ campaign }: { campaign: Campaign }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="type-subtitle-1 font-bold text-foreground">
          รายละเอียดแคมเปญ
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

/**
 * The regulatory line.
 *
 * Its own component because both bodies print it and it must look the same on
 * each: a quiet, bordered block that is clearly not part of the pitch above it.
 */
export function Disclaimer({ text }: { text: string }) {
  return (
    <section className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        คำเตือน
      </p>
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">{text}</p>
    </section>
  );
}
