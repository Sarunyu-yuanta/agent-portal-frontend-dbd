"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Chip } from "@sarunyu/system-one";
import { MutualFundPerformerStack, MutualFundSeeMoreIcon } from "./MutualFundCard";
import { MutualFundChipScroller } from "./MutualFundChipScroller";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  MUTUAL_FUND_CATEGORIES,
  mutualFundCategoryHref,
  type MutualFund,
  type MutualFundCategoryId,
} from "./mutual-fund-data";

/** Figma 40118:77235 — 568×458 left column */
export function MutualFundTopPerformersSection({
  categoryId,
  onCategoryChange,
  funds,
  onFundSelect,
  onSeeAll,
}: {
  categoryId: MutualFundCategoryId;
  onCategoryChange: (id: MutualFundCategoryId) => void;
  funds: MutualFund[];
  onFundSelect?: (fundId: string) => void;
  onSeeAll?: (categoryId: MutualFundCategoryId) => void;
}) {
  const seeAllHref = mutualFundCategoryHref(categoryId);
  return (
    <section className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Image
            src={MF_ASSETS.thumbsUp}
            alt=""
            width={18}
            height={16}
            className="h-[15.625px] w-[17.5px] shrink-0 object-contain"
          />
          <h2 className="flex-1 text-lg font-bold leading-7 text-[#101828]">กองทุนผลตอบแทนเด่น</h2>
        </div>

        <div className="-mx-4 md:-mx-8 lg:mx-0">
          <MutualFundChipScroller leadInset>
            {MUTUAL_FUND_CATEGORIES.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.label}
                type="single"
                size="small"
                selected={categoryId === cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className="shrink-0"
              />
            ))}
          </MutualFundChipScroller>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-[#f3f4f6] p-2">
        <div className="flex h-8 items-center justify-end px-3">
          <span className="text-xs font-semibold leading-4 text-[#101828]">
            ผลดำเนินงานย้อนหลัง 1 ปี
          </span>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <MutualFundPerformerStack funds={funds} onFundSelect={onFundSelect} />
          {funds.length > 0 ? (
            <Link
              href={seeAllHref}
              className="inline-flex w-fit shrink-0 no-underline"
              onClick={
                onSeeAll
                  ? (e) => {
                      e.preventDefault();
                      onSeeAll(categoryId);
                    }
                  : undefined
              }
            >
              <Button variant="plain" size="xl" rightIcon={<MutualFundSeeMoreIcon />} className="w-fit shrink-0">
                ดูเพิ่มเติม
              </Button>
            </Link>
          ) : (
            <Button variant="plain" size="xl" rightIcon={<MutualFundSeeMoreIcon />} className="w-fit shrink-0" disabled>
              ดูเพิ่มเติม
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
