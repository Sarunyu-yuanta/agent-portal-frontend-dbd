"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button, Toggle } from "@sarunyu/system-one";
import { ArrowLeftIcon, InfoIcon } from "@phosphor-icons/react";
import { MutualFundListCard, TagFilterChip } from "./MutualFundCard";
import { MutualFundGroupHeroGraphic } from "./MutualFundGroupHero";
import { MutualFundTopPerformersMobile } from "./MutualFundTopPerformersMobile";
import { MutualFundLegendModal } from "./MutualFundLegendSheet";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  getMobileGroupGridFunds,
  MOBILE_FUND_GROUPS,
  MOBILE_PERFORMANCE_PERIODS,
  TOP_PERFORMERS_LIST_UPDATED_AT,
  type MobileFundGroupId,
  type MobilePerformancePeriod,
} from "./mutual-fund-data";

const HERO_SUBTITLE = "คัดสรรกองทุนเด่น เพื่อคุณโดยเฉพาะ";

function CategoryTabs({
  activeId,
  onSelect,
}: {
  activeId: MobileFundGroupId;
  onSelect: (id: MobileFundGroupId) => void;
}) {
  return (
    <div className="w-full overflow-x-auto xl:overflow-visible">
      <div className="flex w-full min-w-max xl:min-w-0">
        {MOBILE_FUND_GROUPS.map((group) => {
          const active = group.id === activeId;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelect(group.id)}
              className={`flex min-w-[80px] flex-1 items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm font-bold leading-5 whitespace-nowrap ${
                active
                  ? "border-[#0a6ee7] text-[#0a6ee7]"
                  : "border-black/10 text-[#6a7282]"
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MutualFundTagLegend({
  viewActive,
  highlightActive,
  onToggleView,
  onToggleHighlight,
  onShowLegend,
}: {
  viewActive: boolean;
  highlightActive: boolean;
  onToggleView: () => void;
  onToggleHighlight: () => void;
  onShowLegend: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2 px-3">
      <div className="flex items-center gap-2">
        <TagFilterChip
          icon={MF_ASSETS.performersTagView}
          label="View"
          active={viewActive}
          onClick={onToggleView}
        />
        <TagFilterChip
          icon={MF_ASSETS.performersTagHighlight}
          label="Highlight"
          active={highlightActive}
          onClick={onToggleHighlight}
        />
      </div>
      <Button
        variant="plain"
        size="xs"
        onClick={onShowLegend}
        leftIcon={<InfoIcon size={16} />}
        className="shrink-0 !px-0"
      >
        ดูคำอธิบาย
      </Button>
    </div>
  );
}

function PerformancePeriodTabs({
  active,
  onChange,
}: {
  active: MobilePerformancePeriod;
  onChange: (period: MobilePerformancePeriod) => void;
}) {
  return (
    <div className="flex h-10 w-full items-center justify-center">
      <div className="flex w-full rounded-full bg-[#f3f3f3] p-1">
        {MOBILE_PERFORMANCE_PERIODS.map((period) => {
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
  initialGroupId,
  onBack,
  onFundSelect,
}: {
  initialGroupId: MobileFundGroupId;
  onBack: () => void;
  onFundSelect?: (fundId: string) => void;
}) {
  const [groupId, setGroupId] = useState<MobileFundGroupId>(initialGroupId);
  const [pickOnly, setPickOnly] = useState(false);
  const [period, setPeriod] = useState<MobilePerformancePeriod>("1M");
  const [legendOpen, setLegendOpen] = useState(false);
  const [viewActive, setViewActive] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);

  const group = MOBILE_FUND_GROUPS.find((g) => g.id === groupId) ?? MOBILE_FUND_GROUPS[0];
  const heroTitle = group.id === "all" ? "กองทุนทั้งหมด" : group.label;

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [groupId]);

  const funds = useMemo(
    () => getMobileGroupGridFunds(groupId, pickOnly, 16),
    [groupId, pickOnly],
  );

  const listCountLabel = `${funds.length} รายการ`;
  const bothOrNeitherTag = viewActive === highlightActive;
  const showViewTag = bothOrNeitherTag || viewActive;
  const showHighlightTag = bothOrNeitherTag || highlightActive;

  return (
    <>
      <div className="lg:hidden">
        <MutualFundTopPerformersMobile onBack={onBack} onFundSelect={onFundSelect} />
      </div>

      <div className="hidden w-full flex-1 flex-col bg-white pb-20 lg:flex">
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
          <CategoryTabs activeId={groupId} onSelect={setGroupId} />
        </div>
      </div>

      <div className="relative w-full overflow-hidden bg-[#f9fafb]">
        <div className="relative mx-auto flex h-[126px] w-full max-w-[996px] shrink-0 items-center gap-1.5 overflow-visible px-4 pb-2.5 pt-2.5 md:px-8 lg:px-0">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="text-xl font-bold leading-[30px] text-[#074ea4]">{heroTitle}</p>
            <p className="text-sm font-normal leading-5 text-[#4a5565]">{HERO_SUBTITLE}</p>
            <p className="text-[9px] font-normal leading-[14px] text-[#6a7282]">
              ข้อมูล ณ วันที่ {TOP_PERFORMERS_LIST_UPDATED_AT}
            </p>
          </div>
          <MutualFundGroupHeroGraphic groupId={groupId} scale={1.15} />
        </div>
        <div className="relative z-20 h-3 w-full bg-gradient-to-r from-[#00a1e9] to-[#004eba]" />
      </div>

      <div className="relative z-10 w-full rounded-xl bg-gradient-to-r from-[#00a1e9] to-[#004eba]">
        <div className="w-full rounded-t-xl bg-white pt-4 pb-6">
          <div className="mx-auto flex w-full max-w-[996px] flex-col gap-6 px-4 md:px-8 lg:px-0">
            <div className="flex w-full flex-col gap-3">
              <MutualFundTagLegend
                viewActive={viewActive}
                highlightActive={highlightActive}
                onToggleView={() => setViewActive((v) => !v)}
                onToggleHighlight={() => setHighlightActive((v) => !v)}
                onShowLegend={() => setLegendOpen(true)}
              />
              <div className="flex w-full items-center justify-end gap-2 px-3">
                <p className="min-w-0 flex-1 text-sm font-normal leading-5 text-[#101828]">{listCountLabel}</p>
                <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-white p-0.5">
                  <div className="flex aspect-square size-4 shrink-0 items-center overflow-hidden">
                    <Image src={MF_ASSETS.performersTagHighlight} alt="" width={16} height={16} className="size-4 shrink-0" />
                  </div>
                  <span className="text-sm font-normal leading-5 text-[#101828]">Pick</span>
                </div>
                <Toggle size="sm" checked={pickOnly} onChange={setPickOnly} ariaLabel="Pick" />
              </div>
              <PerformancePeriodTabs active={period} onChange={setPeriod} />
            </div>

            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-6">
              {funds.map((fund, index) => (
                <div key={`${fund.id}-${index}`} className="min-w-0">
                  <MutualFundListCard
                    fund={fund}
                    onSelect={onFundSelect}
                    showView={showViewTag}
                    showHighlight={showHighlightTag}
                  />
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

      <MutualFundLegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
    </>
  );
}
