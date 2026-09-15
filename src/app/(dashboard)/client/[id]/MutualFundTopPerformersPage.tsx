"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { MutualFundListCard } from "./MutualFundCard";
import { MF_ASSETS, mutualFundPerformersHeroSrc } from "./mutual-fund-assets";
import {
  getTopPerformersGridFunds,
  MUTUAL_FUND_CATEGORIES,
  MUTUAL_FUND_PERFORMANCE_PERIODS,
  mutualFundCategoryHref,
  TOP_PERFORMERS_DISPLAY_COUNT,
  TOP_PERFORMERS_LIST_UPDATED_AT,
  TOP_PERFORMERS_TAB_CATEGORIES,
  type MutualFundCategoryId,
  type MutualFundPerformancePeriod,
} from "./mutual-fund-data";

const HERO_SUBTITLE = "คัดสรรกองทุนเด่น เพื่อคุณโดยเฉพาะ";

/** Figma 39889:665476 — emerging / reits / commodities tabs do not flex-grow. */
const CATEGORY_TAB_SHRINK = new Set<MutualFundCategoryId>([
  "emerging-equity",
  "reits",
  "commodities",
]);

function PickToggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  if (!checked) {
    return (
      <button type="button" aria-label="Pick" onClick={() => onChange(true)} className="relative h-5 w-8 shrink-0">
        <Image src={MF_ASSETS.performersPickToggleOff} alt="" width={32} height={20} className="size-full" />
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked
      aria-label="Pick"
      onClick={() => onChange(false)}
      className="relative h-5 w-8 shrink-0 rounded-full bg-[#0a6ee7]"
    >
      <span className="absolute right-0.5 top-0.5 size-4 rounded-full bg-white shadow" />
    </button>
  );
}

function CategoryTabs({
  activeId,
  onSelect,
}: {
  activeId: MutualFundCategoryId;
  onSelect: (id: MutualFundCategoryId) => void;
}) {
  return (
    <div className="w-full overflow-x-auto xl:overflow-visible">
      <div className="flex w-full min-w-max xl:min-w-0">
        {TOP_PERFORMERS_TAB_CATEGORIES.map((cat) => {
          const active = cat.id === activeId;
          const shrinkOnly = CATEGORY_TAB_SHRINK.has(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`flex min-w-[80px] items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm font-bold leading-5 whitespace-nowrap ${
                shrinkOnly ? "shrink-0" : "min-w-[80px] flex-1"
              } ${
                active
                  ? "border-[#0a6ee7] text-[#0a6ee7]"
                  : "border-black/10 text-[#6a7282]"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PerformancePeriodTabs({
  active,
  onChange,
}: {
  active: MutualFundPerformancePeriod;
  onChange: (period: MutualFundPerformancePeriod) => void;
}) {
  return (
    <div className="flex h-10 w-full items-center justify-center">
      <div className="flex w-full rounded-full bg-[#f3f3f3] p-1">
        {MUTUAL_FUND_PERFORMANCE_PERIODS.map((period) => {
          const selected = period === active;
          return (
            <button
              key={period}
              type="button"
              onClick={() => onChange(period)}
              className={`flex min-h-8 flex-1 items-center justify-center rounded-full px-2 py-1.5 text-xs font-semibold leading-4 ${
                selected
                  ? "bg-white text-[#292524] shadow-[0px_4px_8px_0px_rgba(28,25,23,0.03),0px_8px_16px_0px_rgba(28,25,23,0.02)]"
                  : "text-[#4a5565]"
              }`}
            >
              {period}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Figma 39889:665472 — mutual fund top performers list. */
export function MutualFundTopPerformersPage({
  categoryId,
  onBack,
  onFundSelect,
}: {
  categoryId: MutualFundCategoryId;
  onBack: () => void;
  onFundSelect?: (fundId: string) => void;
}) {
  const router = useRouter();
  const [pickOnly, setPickOnly] = useState(false);
  const [period, setPeriod] = useState<MutualFundPerformancePeriod>("1Y");

  const category = MUTUAL_FUND_CATEGORIES.find((c) => c.id === categoryId) ?? MUTUAL_FUND_CATEGORIES[0];

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [categoryId]);

  const funds = useMemo(
    () => getTopPerformersGridFunds(categoryId, pickOnly, 16),
    [categoryId, pickOnly],
  );

  const heroSrc = mutualFundPerformersHeroSrc(categoryId);

  const listCountLabel = pickOnly ? `${funds.length} รายการ` : `${TOP_PERFORMERS_DISPLAY_COUNT} รายการ`;

  const handleCategoryChange = (id: MutualFundCategoryId) => {
    router.push(mutualFundCategoryHref(id));
  };

  return (
    <div className="flex w-full flex-1 flex-col bg-[#f9fafb] pb-20">
      <div className="w-full bg-white">
        <div className="mx-auto flex w-full max-w-[996px] items-center gap-2 px-4 pb-2 pt-8 md:px-8 lg:px-0">
          <Button
            variant="plain"
            size="icon-sm"
            onClick={onBack}
            aria-label="กลับ"
            className="size-[30px] shrink-0 rounded-md p-[5px]"
          >
            <ArrowLeftIcon size={20} />
          </Button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold leading-7 text-[#101828]">
            กองทุนผลตอบแทนเด่น
          </h1>
        </div>

        <div className="mx-auto w-full max-w-[996px] px-4 md:px-8 lg:px-0">
          <CategoryTabs activeId={categoryId} onSelect={handleCategoryChange} />
        </div>
      </div>

      <div className="relative h-[126px] w-full shrink-0 overflow-visible pb-2.5 pt-2.5">
        <div className="mx-auto flex h-full w-full max-w-[996px] flex-col justify-center gap-1.5 px-4 md:px-8 lg:px-0">
          <p className="text-xl font-bold leading-[30px] text-[#074ea4]">{category.label}</p>
          <p className="text-sm font-normal leading-5 text-[#4a5565]">{HERO_SUBTITLE}</p>
          <p className="text-[9px] font-normal leading-[14px] text-[#6a7282]">
            ข้อมูล ณ วันที่ {TOP_PERFORMERS_LIST_UPDATED_AT}
          </p>
        </div>
        <div
          className="pointer-events-none absolute -top-[3px] z-0 right-4 h-[161px] w-[124px] md:right-8 lg:right-[max(1rem,calc(50%-498px))]"
          aria-hidden
        >
          <Image
            key={categoryId}
            src={heroSrc}
            alt=""
            fill
            className="object-contain object-right"
            sizes="124px"
            priority
          />
        </div>
      </div>

      <div className="relative z-10 w-full rounded-xl bg-gradient-to-r from-[#00a1e9] to-[#004eba] pt-3">
        <div className="w-full rounded-t-xl bg-white pt-4 pb-6">
          <div className="mx-auto flex w-full max-w-[996px] flex-col gap-6 px-4 md:px-8 lg:px-0">
            <div className="flex w-full flex-col gap-3">
              <div className="flex w-full items-center justify-end gap-2 px-3">
                <p className="min-w-0 flex-1 text-sm font-normal leading-5 text-[#101828]">{listCountLabel}</p>
                <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-white p-0.5">
                  <div className="flex aspect-square size-4 shrink-0 items-center overflow-hidden">
                    <Image src={MF_ASSETS.yuantaPick} alt="" width={16} height={16} className="size-4 shrink-0" />
                  </div>
                  <span className="text-sm font-normal leading-5 text-[#101828]">Pick</span>
                </div>
                <PickToggle checked={pickOnly} onChange={setPickOnly} />
              </div>
              <PerformancePeriodTabs active={period} onChange={setPeriod} />
            </div>

            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-6">
              {funds.map((fund, index) => (
                <div key={`${fund.id}-${index}`} className="min-w-0">
                  <MutualFundListCard fund={fund} onSelect={onFundSelect} />
                </div>
              ))}
            </div>

            {funds.length === 0 ? (
              <p className="px-3 text-center text-sm font-normal text-[#6a7282]">ไม่พบกองทุนในหมวดนี้</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
