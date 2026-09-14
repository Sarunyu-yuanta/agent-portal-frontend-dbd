"use client";

import Image from "next/image";
import Link from "next/link";
import { Tag } from "@sarunyu/system-one";
import type { MutualFund } from "./mutual-fund-data";
import { MF_ASSETS, mutualFundRiskMeterSrc } from "./mutual-fund-assets";

function mutualFundDetailHref(fundId: string) {
  return `/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`;
}

export { mutualFundDetailHref };

/** Figma Button plain xl — chevron icon (#0A6EE7, 20×20). */
export function MutualFundSeeMoreIcon() {
  return (
    <Image src={MF_ASSETS.arrowRightBlue} alt="" width={20} height={20} className="size-5 shrink-0" />
  );
}

function PickTag() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-[#eff6ff] px-1 py-0.5">
      <Image src={MF_ASSETS.yuantaPick} alt="" width={11} height={11} className="size-[11px] shrink-0" />
      <span
        className="text-[7px] leading-[11px] font-normal bg-gradient-to-r from-[#00a1e9] to-[#004eba] bg-clip-text text-transparent"
      >
        Pick
      </span>
    </span>
  );
}

/** Figma Risk Meter — 16×16 clip box with inset arc asset (node 36234:961852). */
function RiskMeterIcon({ risk }: { risk: number }) {
  return (
    <span className="relative size-4 shrink-0 overflow-clip">
      <span className="absolute bottom-[29.17%] left-[8.33%] right-[8.33%] top-1/4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mutualFundRiskMeterSrc(risk)}
          alt=""
          className="absolute inset-0 block size-full max-w-none"
        />
      </span>
    </span>
  );
}

/** Figma risk pill — compact 71×20 badge, not full-width (node 36234:961677). */
function RiskBadge({ risk }: { risk: number }) {
  return (
    <div className="flex w-full shrink-0 gap-1 items-start">
      <div className="flex h-5 shrink-0 flex-col items-start">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-0.5">
          <RiskMeterIcon risk={risk} />
          <span className="flex flex-col justify-center text-xs font-semibold leading-4 text-[#4a5565] whitespace-nowrap">
            risk: {risk}
          </span>
        </span>
      </div>
    </div>
  );
}

function PriceChange({ fund }: { fund: MutualFund }) {
  const isNeutral = fund.changeAbs === "0.0000";
  const isPositive = !isNeutral && fund.changePct.startsWith("+");
  const valueColor = isNeutral ? "#4a5565" : isPositive ? "#008236" : "#fb2c36";

  return (
    <div className="flex flex-col items-end shrink-0 whitespace-nowrap">
      <div className="flex items-center gap-1 text-sm font-bold leading-5 text-[#101828]">
        <span>{fund.price}</span>
        <span>{fund.currency}</span>
      </div>
      <div className="flex items-center gap-1 text-xs leading-4" style={{ color: valueColor }}>
        <span>{fund.changeAbs}</span>
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs leading-4 bg-[#dbfce7] text-[#008236]">
          {fund.changePct}
        </span>
      </div>
    </div>
  );
}

function Sparkline() {
  return (
    <div className="relative h-[30px] w-12 shrink-0">
      <Image src={MF_ASSETS.sparkline} alt="" fill className="object-contain" sizes="48px" />
    </div>
  );
}

/** Figma node 40118:77260 — Mutual fund card row */
export function MutualFundCard({
  fund,
  onSelect,
}: {
  fund: MutualFund;
  onSelect?: (fundId: string) => void;
}) {
  const content = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <span className="text-sm font-bold leading-5 text-[#101828] whitespace-nowrap">
              {fund.symbol}
            </span>
            {fund.isPick && <PickTag />}
          </div>
          <p className="truncate text-xs leading-4 text-[#4a5565]">{fund.name}</p>
        </div>
        <Sparkline />
        <PriceChange fund={fund} />
      </div>
      <RiskBadge risk={fund.risk} />
    </div>
  );

  const href = mutualFundDetailHref(fund.id);
  const rowClassName =
    "block w-full p-3 text-left no-underline text-inherit cursor-pointer hover:bg-black/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:ring-inset";

  if (onSelect) {
    return (
      <Link
        href={href}
        className={rowClassName}
        onClick={(e) => {
          e.preventDefault();
          onSelect(fund.id);
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <Link href={href} className={rowClassName}>
      {content}
    </Link>
  );
}

/** Top performers — single white card with row dividers (Figma 40118:77257). */
export function MutualFundPerformerStack({
  funds,
  onFundSelect,
}: {
  funds: MutualFund[];
  onFundSelect?: (fundId: string) => void;
}) {
  const visible = funds.slice(0, 3);
  return (
    <div className="w-full overflow-hidden rounded-lg border border-black/10 bg-white">
      {visible.map((fund, i) => (
        <div key={fund.id} className={i > 0 ? "border-t border-black/10" : ""}>
          <MutualFundCard fund={fund} onSelect={onFundSelect} />
        </div>
      ))}
    </div>
  );
}

/** Theme list card — single white container with row dividers (Figma 40118:77418, 300×276). */
export function MutualFundThemeList({
  funds,
  onFundSelect,
}: {
  funds: MutualFund[];
  onFundSelect?: (fundId: string) => void;
}) {
  const visible = funds.slice(0, 3);
  return (
    <div className="h-[276px] w-full shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white">
      {visible.map((fund, i) => (
        <div key={fund.id} className={i > 0 ? "border-t border-black/10" : ""}>
          <MutualFundCard fund={fund} onSelect={onFundSelect} />
        </div>
      ))}
    </div>
  );
}

/** Insight card fund tag — library Tag for symbol chips only */
export function MutualFundSymbolTag({ symbol }: { symbol: string }) {
  return <Tag text={symbol} variant="blue" size="small" />;
}
