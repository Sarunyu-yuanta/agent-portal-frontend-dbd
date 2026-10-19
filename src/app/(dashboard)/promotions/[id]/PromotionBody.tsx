"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { Alert, Tag } from "@sarunyu/system-one";
import type { Campaign } from "@/types/domain";
import { PRODUCT_LABEL, SEGMENT_LABEL } from "../campaign-data";
import { DetailSectionGroup, DetailSubsection } from "./DetailSection";

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
    <div className="flex flex-col gap-5">
      <DetailSectionGroup>
        <DetailSubsection title="รายละเอียดแคมเปญ">
          {/* The long form, not `summary` — that one-liner is already in the
              banner directly above this section. */}
          <div className="flex flex-col gap-3">
            {campaign.description.map((paragraph) => (
              <p
                key={paragraph}
                className="text-[14px] leading-relaxed text-foreground"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {campaign.products.map((product) => (
              <Tag key={product} text={PRODUCT_LABEL[product]} variant="blue" size="small" />
            ))}
            {campaign.segments.map((segment) => (
              <Tag key={segment} text={SEGMENT_LABEL[segment]} variant="gray" size="small" />
            ))}
          </div>
        </DetailSubsection>

        <DetailSubsection title="เงื่อนไขการเข้าร่วม">
          <ul className="flex list-none flex-col gap-2 p-0">
            {campaign.conditions.map((condition) => (
              <li
                key={condition}
                className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3"
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-action text-white"
                >
                  <CheckIcon size={13} weight="bold" />
                </span>
                <span className="text-[13.5px] leading-relaxed text-foreground">
                  {condition}
                </span>
              </li>
            ))}
          </ul>
        </DetailSubsection>

        <DetailSubsection title="ข้อกำหนดและเงื่อนไข">
          <ol className="flex list-none flex-col gap-2 p-0">
            {campaign.terms.map((term, index) => (
              <li
                key={term}
                className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-action text-[11px] font-bold tabular-nums text-white">
                  {index + 1}
                </span>
                <span className="text-[13.5px] leading-relaxed text-foreground">
                  {term}
                </span>
              </li>
            ))}
          </ol>
        </DetailSubsection>

        <div className="not-first:mt-6 not-first:border-t not-first:border-border/50 not-first:pt-6">
          <Disclaimer text={campaign.disclaimer} />
        </div>
      </DetailSectionGroup>
    </div>
  );
}

/** Regulatory disclaimer — shared by promotion and event detail bodies. */
export function Disclaimer({ text }: { text: string }) {
  return (
    <Alert status="warning" title="คำเตือน" message={text} multiline />
  );
}
