"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon, InfoIcon } from "@phosphor-icons/react";
import { MutualFundListCard, TagFilterChip } from "./MutualFundCard";
import { THEME_HERO_COLOR, THEME_ICON_COMPONENTS, ThemeHeroGraphic } from "./MutualFundThemesSection";
import { MutualFundThemeDetailMobile } from "./MutualFundThemeDetailMobile";
import { MutualFundLegendModal } from "./MutualFundLegendSheet";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  MUTUAL_FUND_THEME_IDS,
  MOBILE_PERFORMANCE_PERIODS,
  TOP_PERFORMERS_LIST_UPDATED_AT,
  getMutualFundTheme,
  getThemeDescription,
  getThemeGridFunds,
  getThemeHeroTitle,
  type MobilePerformancePeriod,
  type MutualFundThemeId,
} from "./mutual-fund-data";

function ThemeTabs({
  activeId,
  onSelect,
}: {
  activeId: MutualFundThemeId;
  onSelect: (id: MutualFundThemeId) => void;
}) {
  return (
    <div className="w-full overflow-x-auto xl:overflow-visible">
      <div className="flex w-full min-w-max xl:min-w-0">
        {MUTUAL_FUND_THEME_IDS.map((themeId) => {
          const theme = getMutualFundTheme(themeId);
          const active = themeId === activeId;
          return (
            <button
              key={themeId}
              type="button"
              onClick={() => onSelect(themeId)}
              className={`flex min-w-[80px] flex-1 items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm font-bold leading-5 whitespace-nowrap ${
                active ? "border-[#0a6ee7] text-[#0a6ee7]" : "border-black/10 text-[#6a7282]"
              }`}
            >
              {theme.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DesktopThemeHero({ themeId }: { themeId: MutualFundThemeId }) {
  const theme = getMutualFundTheme(themeId);
  const Icon = THEME_ICON_COMPONENTS[theme.icon];

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: THEME_HERO_COLOR.glow }}>
      <div className="relative mx-auto flex h-[126px] w-full max-w-[996px] shrink-0 items-center gap-1.5 overflow-visible px-4 pb-2.5 pt-2.5 md:px-8 lg:px-0">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Icon size={24} weight="fill" style={{ color: THEME_HERO_COLOR.title }} />
            <p className="min-w-0 flex-1 truncate text-xl font-bold leading-[30px]" style={{ color: THEME_HERO_COLOR.title }}>
              {getThemeHeroTitle(themeId)}
            </p>
          </div>
          <p className="text-sm font-normal leading-5 text-[#4a5565]">{getThemeDescription(themeId)}</p>
          <p className="text-[9px] font-normal leading-[14px] text-[#6a7282]">
            ข้อมูล ณ วันที่ {TOP_PERFORMERS_LIST_UPDATED_AT}
          </p>
        </div>
        <ThemeHeroGraphic themeId={themeId} scale={1.15} />
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

/** Figma 39839:525396 — mutual fund theme detail page ("ดูเพิ่มเติม" destination); same template as MutualFundTopPerformersPage. */
export function MutualFundThemeDetailPage({
  themeId: initialThemeId,
  onBack,
  onFundSelect,
}: {
  themeId: MutualFundThemeId;
  onBack: () => void;
  onFundSelect?: (fundId: string) => void;
}) {
  const [themeId, setThemeId] = useState<MutualFundThemeId>(initialThemeId);
  const [period, setPeriod] = useState<MobilePerformancePeriod>("1M");
  const [legendOpen, setLegendOpen] = useState(false);
  const [viewActive, setViewActive] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [themeId]);

  const funds = useMemo(() => getThemeGridFunds(themeId, false, 16), [themeId]);
  const listCountLabel = `${funds.length} รายการ`;
  const bothOrNeitherTag = viewActive === highlightActive;
  const showViewTag = bothOrNeitherTag || viewActive;
  const showHighlightTag = bothOrNeitherTag || highlightActive;

  return (
    <>
      <div className="lg:hidden">
        <MutualFundThemeDetailMobile
          themeId={themeId}
          onThemeChange={setThemeId}
          onBack={onBack}
          onFundSelect={onFundSelect}
        />
      </div>

      <div className="hidden w-full flex-1 flex-col bg-white pb-20 lg:flex">
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
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold leading-7 text-[#101828]">ธีมกองทุนเด่น</h1>
        </div>

        <div className="mx-auto w-full max-w-[996px] px-4 md:px-8 lg:px-0">
          <ThemeTabs activeId={themeId} onSelect={setThemeId} />
        </div>

        <DesktopThemeHero themeId={themeId} />

        <div
          className="relative z-10 w-full rounded-xl"
          style={{
            backgroundImage: `linear-gradient(to right, ${THEME_HERO_COLOR.from}, ${THEME_HERO_COLOR.to})`,
          }}
        >
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
                <p className="w-full px-3 text-sm font-normal leading-5 text-[#101828]">{listCountLabel}</p>
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
                <p className="px-3 text-center text-sm font-normal text-[#6a7282]">ไม่พบกองทุนในธีมนี้</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <MutualFundLegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
    </>
  );
}
