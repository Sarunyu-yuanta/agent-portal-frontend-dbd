"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { ROBO_ASSETS } from "./robo-advisory-assets";

const HOVER_TRANSITION = "duration-500 ease-in-out";

const ADVISORY_CARD_CLASS = [
  "group relative w-full min-w-0 shrink-0 cursor-pointer overflow-hidden rounded-lg p-4",
  "h-[124px] min-h-[124px] md:flex-1 lg:h-[135px] lg:min-h-[135px]",
  `transition-[box-shadow,transform] ${HOVER_TRANSITION}`,
  "shadow-[0px_0px_2px_rgba(102,102,102,0.16),0px_4px_8px_rgba(102,102,102,0.12)]",
  "hover:-translate-y-0.5 hover:shadow-[0px_2px_4px_rgba(102,102,102,0.14),0px_8px_20px_rgba(102,102,102,0.18)]",
  "active:translate-y-0 active:shadow-[0px_0px_2px_rgba(102,102,102,0.16),0px_4px_8px_rgba(102,102,102,0.12)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:ring-offset-2",
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
].join(" ");

/** Figma 33787:150672 — arrow-right 24×24 */
function ArrowRightIcon() {
  return (
    <span className={`relative inline-flex size-6 shrink-0 transition-transform ${HOVER_TRANSITION} group-hover:translate-x-1 group-active:translate-x-0 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0`}>
      <Image src={ROBO_ASSETS.arrowRight} alt="" fill className="object-contain" />
    </span>
  );
}

function AdvisoryServiceCard({
  backgroundImage,
  children,
  decoration,
  onClick,
  className,
}: {
  backgroundImage: string;
  children: ReactNode;
  decoration: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`${ADVISORY_CARD_CLASS} flex items-start justify-end ${className ?? ""}`}
      style={{ backgroundImage }}
    >
      {children}
      {decoration}
    </div>
  );
}

/** Figma 33772:161292 / 33777:122715 — mobile+tablet 311–312×60 (3×20px lines). */
const ROBO_COMPACT_DESCRIPTION_LINES = [
  "คือบริการลงทุนแบบอัตโนมัติด้วย AI",
  "ที่จะช่วยให้บรรลุเป้าหมายการลงทุนได้",
  "อย่างง่ายดาย",
] as const;

/** Figma 33787:150673 — desktop 500×40 (2×20px lines, body-1 16px). */
const ROBO_DESKTOP_DESCRIPTION_LINES = [
  "คือบริการลงทุนแบบอัตโนมัติด้วย AI ที่จะช่วยให้บรรลุ",
  "เป้าหมายการลงทุนได้อย่างง่ายดาย",
] as const;

function RoboAdvisoryDescription() {
  return (
    <div className="w-full min-w-0 text-sm leading-5 text-[#4a5565] lg:text-base lg:leading-5 lg:text-black/60">
      <div className="max-lg:w-full max-lg:max-w-[311px] lg:hidden">
        {ROBO_COMPACT_DESCRIPTION_LINES.map((line, index) => (
          <p
            key={line}
            className={`max-lg:whitespace-nowrap ${index < ROBO_COMPACT_DESCRIPTION_LINES.length - 1 ? "mb-0" : ""}`}
          >
            {line}
          </p>
        ))}
      </div>
      <div className="hidden lg:block lg:max-w-[500px]">
        {ROBO_DESKTOP_DESCRIPTION_LINES.map((line, index) => (
          <p
            key={line}
            className={`lg:whitespace-nowrap ${index < ROBO_DESKTOP_DESCRIPTION_LINES.length - 1 ? "mb-0" : ""}`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Figma 33772:161292 mobile / 33777:122715 tablet / 33787:150668 desktop */
function RoboAdvisoryCard({ onSelect }: { onSelect?: () => void }) {
  return (
    <AdvisoryServiceCard
      backgroundImage="linear-gradient(to right, #ffffff, #c7e8f3)"
      onClick={onSelect}
      decoration={
        <Image
          src={ROBO_ASSETS.roboIllustration}
          alt=""
          width={101}
          height={153}
          className={`pointer-events-none absolute z-0 object-contain object-bottom transition-transform ${HOVER_TRANSITION} group-hover:scale-[1.03] max-lg:!bottom-[-29.13px] max-lg:!h-[129px] max-lg:!w-[92px] motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
          style={{ right: 15.76, bottom: -20.13, width: 101, height: 153 }}
        />
      }
    >
      <div className="relative z-[1] flex w-full min-w-0 flex-1 flex-col gap-2 lg:gap-[7.864px]">
        <div className="flex w-full min-w-0 items-start justify-between">
          <p className={`min-w-0 flex-1 text-base font-bold leading-6 text-[#101828] transition-colors ${HOVER_TRANSITION} group-hover:text-[#0a1629] lg:text-black/75 lg:group-hover:text-black/85`}>
            Robo Advisory
          </p>
          <ArrowRightIcon />
        </div>
        <RoboAdvisoryDescription />
      </div>
    </AdvisoryServiceCard>
  );
}

/** Figma mobile/tablet Definit card — 3×20px lines. */
const DEFINIT_COMPACT_DESCRIPTION_LINES = [
  "เหมาะกับนักลงทุนในตลาดไทย ",
  "วิเคราะห์ปัจจัยรอบด้านทั้ง พื้นฐาน ",
  "มูลค่า และ เทคนิค ",
] as const;

/** definit-finno.png placement matched to Figma 34028:17715 via export diff (532×135 card). */
const DEFINIT_FINNO_STYLE: CSSProperties = {
  right: -11.19,
  bottom: -9.24,
  width: 141.96,
  height: 144.48,
};

/** Figma 33772:161290 mobile / 33777:122714 tablet / 34028:17715 desktop */
function DefinitCard({ onSelect }: { onSelect?: () => void }) {
  return (
    <AdvisoryServiceCard
      backgroundImage="linear-gradient(to right, #ffffff, #7eabe2)"
      onClick={onSelect}
      decoration={
        <Image
          src={ROBO_ASSETS.definitFinno}
          alt=""
          width={169}
          height={172}
          className={`pointer-events-none absolute z-0 object-contain transition-transform ${HOVER_TRANSITION} group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
          style={DEFINIT_FINNO_STYLE}
        />
      }
    >
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex w-full min-w-0 items-start justify-between gap-2">
          <p className={`min-w-0 flex-1 text-base font-bold leading-6 text-[#101828] transition-colors ${HOVER_TRANSITION} group-hover:text-[#0a1629]`}>
            Definit by finnomena.
          </p>
          <ArrowRightIcon />
        </div>
        <div className="w-full min-w-0 text-sm leading-5 text-[#4a5565] lg:text-base lg:leading-5">
          <div className="max-lg:max-w-[311px] lg:hidden">
            {DEFINIT_COMPACT_DESCRIPTION_LINES.map((line, index) => (
              <p
                key={line}
                className={`max-lg:whitespace-nowrap ${index < DEFINIT_COMPACT_DESCRIPTION_LINES.length - 1 ? "mb-0" : ""}`}
              >
                {line}
              </p>
            ))}
          </div>
          <div className="hidden lg:block lg:max-w-[500px]">
            {DEFINIT_COMPACT_DESCRIPTION_LINES.map((line, index) => (
              <p
                key={`desktop-${line}`}
                className={`lg:whitespace-nowrap ${index < DEFINIT_COMPACT_DESCRIPTION_LINES.length - 1 ? "mb-0" : ""}`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </AdvisoryServiceCard>
  );
}

function PortfolioAdvisoryHeader() {
  return (
    <div className="flex flex-col">
      <h2 className="bg-gradient-to-r from-[#00a1e9] to-[#004eba] bg-clip-text text-lg font-bold leading-6 text-transparent lg:text-xl lg:leading-[30px]">
        บริการวางแผนพอร์ต
      </h2>
      <p className="text-sm leading-5 text-black/60">
        ให้ Yuanta ช่วยคุณบริหารสินทรัพย์ด้วยแผนการลงทุน Robo Advisory และจากผู้เชี่ยวชาญ
      </p>
    </div>
  );
}

function PortfolioAdvisoryCards({
  onRoboAdvisorySelect,
  onDefinitSelect,
}: {
  onRoboAdvisorySelect?: () => void;
  onDefinitSelect?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 lg:items-end lg:gap-6">
      <RoboAdvisoryCard onSelect={onRoboAdvisorySelect} />
      <DefinitCard onSelect={onDefinitSelect} />
    </div>
  );
}

/** Figma 33772:161280 mobile / 33777:122707 tablet / 33787:150658 desktop */
export function RoboAdvisoryTab({
  onRoboAdvisorySelect,
  onDefinitSelect,
}: {
  onRoboAdvisorySelect?: () => void;
  onDefinitSelect?: () => void;
} = {}) {
  return (
    <div className="w-full bg-white px-4 py-3 md:px-8 md:pb-10 md:pt-3 lg:bg-[#f9fafb] lg:py-10">
      <div className="mx-auto w-full max-w-[1280px] lg:px-6">
        <div
          className="flex flex-col gap-3 md:gap-6 lg:rounded-xl lg:bg-white lg:px-14 lg:py-8 lg:shadow-[0px_0px_2px_rgba(102,102,102,0.16),0px_4px_8px_rgba(102,102,102,0.12)]"
        >
          <PortfolioAdvisoryHeader />
          <PortfolioAdvisoryCards onRoboAdvisorySelect={onRoboAdvisorySelect} onDefinitSelect={onDefinitSelect} />
        </div>
      </div>
    </div>
  );
}
