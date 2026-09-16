"use client";

import { useMemo, useState } from "react";
import { Button, useIsMobile } from "@sarunyu/system-one";
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon, InfoIcon } from "@phosphor-icons/react";
import { MutualFundListCardMobile, TagFilterChip } from "./MutualFundCard";
import { MutualFundGroupHeroGraphic } from "./MutualFundGroupHero";
import { MutualFundLegendBottomSheet, MutualFundLegendModal } from "./MutualFundLegendSheet";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  MOBILE_FUND_GROUPS,
  MOBILE_PERFORMANCE_PERIODS,
  TOP_PERFORMERS_LIST_UPDATED_AT,
  getMobileGroupGridFunds,
  type MobileFundGroupId,
  type MobilePerformancePeriod,
} from "./mutual-fund-data";

const HERO_SUBTITLE = "คัดสรรกองทุนเด่น เพื่อคุณโดยเฉพาะ";

function MobileCategoryTabs({
  activeId,
  onSelect,
}: {
  activeId: MobileFundGroupId;
  onSelect: (id: MobileFundGroupId) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex w-max min-w-full">
        {MOBILE_FUND_GROUPS.map((group) => {
          const active = group.id === activeId;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelect(group.id)}
              className={`flex min-w-[80px] shrink-0 items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm font-bold leading-5 whitespace-nowrap ${
                active ? "border-[#0a6ee7] text-[#0a6ee7]" : "border-black/10 text-[#6a7282]"
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

function MobileHero({ groupId }: { groupId: MobileFundGroupId }) {
  const group = MOBILE_FUND_GROUPS.find((g) => g.id === groupId) ?? MOBILE_FUND_GROUPS[0];
  const title = group.id === "all" ? "กองทุนทั้งหมด" : group.label;

  return (
    <div className="relative flex h-[126px] w-full shrink-0 items-center gap-2.5 overflow-visible bg-[#f9fafb] px-6 pb-2.5 pt-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-xl font-bold leading-[30px] text-[#074ea4]">{title}</p>
        <p className="text-sm font-normal leading-5 text-[#4a5565]">{HERO_SUBTITLE}</p>
        <p className="text-[9px] font-normal leading-[14px] text-[#6a7282]">
          ข้อมูล ณ วันที่ {TOP_PERFORMERS_LIST_UPDATED_AT}
        </p>
      </div>
      <MutualFundGroupHeroGraphic groupId={groupId} />
    </div>
  );
}

function MobileTagLegend({
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

function MobilePeriodTabs({
  active,
  onChange,
}: {
  active: MobilePerformancePeriod;
  onChange: (period: MobilePerformancePeriod) => void;
}) {
  return (
    <div className="flex h-10 w-full items-center gap-1 px-3">
      <Button variant="plain" size="icon-xs" aria-label="ช่วงเวลาก่อนหน้า" className="shrink-0">
        <CaretLeftIcon size={16} />
      </Button>
      <div className="min-w-0 flex-1 overflow-x-auto rounded-full bg-[#f3f3f3] p-1">
        <div className="flex w-max min-w-full">
          {MOBILE_PERFORMANCE_PERIODS.map((period) => {
            const selected = period === active;
            return (
              <button
                key={period}
                type="button"
                onClick={() => onChange(period)}
                className={`flex min-h-8 shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold leading-4 ${
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
      <Button variant="plain" size="icon-xs" aria-label="ช่วงเวลาถัดไป" className="shrink-0">
        <CaretRightIcon size={16} />
      </Button>
    </div>
  );
}

/** Figma 39839:522570 — mobile "Mutual fund top performers" page. */
export function MutualFundTopPerformersMobile({
  onBack,
  onFundSelect,
}: {
  onBack: () => void;
  onFundSelect?: (fundId: string) => void;
}) {
  const [groupId, setGroupId] = useState<MobileFundGroupId>("all");
  const [period, setPeriod] = useState<MobilePerformancePeriod>("1M");
  const [legendOpen, setLegendOpen] = useState(false);
  const [viewActive, setViewActive] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);
  const isPhone = useIsMobile();

  const funds = useMemo(() => getMobileGroupGridFunds(groupId, false, 16), [groupId]);
  const listCountLabel = `${funds.length} รายการ`;
  const bothOrNeitherTag = viewActive === highlightActive;
  const showViewTag = bothOrNeitherTag || viewActive;
  const showHighlightTag = bothOrNeitherTag || highlightActive;

  return (
    <div className="flex w-full flex-1 flex-col bg-white">
      <div className="flex w-full items-center gap-2 px-4 pb-2 pt-4">
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

      <MobileCategoryTabs activeId={groupId} onSelect={setGroupId} />
      <div className="relative w-full overflow-hidden">
        <MobileHero groupId={groupId} />
        <div className="relative z-20 h-3 w-full bg-gradient-to-r from-[#00a1e9] to-[#004eba]" />
      </div>

      <div className="flex w-full flex-col gap-3 pt-4 pb-6">
        <MobileTagLegend
          viewActive={viewActive}
          highlightActive={highlightActive}
          onToggleView={() => setViewActive((v) => !v)}
          onToggleHighlight={() => setHighlightActive((v) => !v)}
          onShowLegend={() => setLegendOpen(true)}
        />
        <MobilePeriodTabs active={period} onChange={setPeriod} />

        <p className="px-3 text-sm leading-5 text-[#101828]">{listCountLabel}</p>

        <div className="flex w-full flex-col">
          {funds.map((fund, index) => (
            <div key={`${fund.id}-${index}`}>
              {index > 0 ? <div className="mx-3 h-px bg-black/10" /> : null}
              <MutualFundListCardMobile
                fund={fund}
                onSelect={onFundSelect}
                showView={showViewTag}
                showHighlight={showHighlightTag}
              />
            </div>
          ))}
        </div>

        {funds.length === 0 ? (
          <p className="px-3 text-center text-sm text-[#6a7282]">ไม่พบกองทุนในหมวดนี้</p>
        ) : null}
      </div>

      {isPhone ? (
        <MutualFundLegendBottomSheet open={legendOpen} onOpenChange={setLegendOpen} />
      ) : (
        <MutualFundLegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
      )}
    </div>
  );
}
