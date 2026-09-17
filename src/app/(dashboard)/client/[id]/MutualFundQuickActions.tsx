"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useIsMobile } from "@sarunyu/system-one";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  MutualFundFilterBottomSheet,
  MutualFundFilterModal,
  EMPTY_FILTER_STATE,
  type MutualFundFilterState,
} from "./MutualFundFilterPanel";
import { navWrite } from "@/lib/nav-session";

export const MUTUAL_FUND_FILTER_STATE_KEY = "nav:mutual-fund-filter-state";

function QuickActionCard({
  title,
  illustration,
  href,
  onClick,
  compact = false,
}: {
  title: string;
  illustration: string;
  href?: string;
  onClick?: () => void;
  compact?: boolean;
}) {
  const body = (
    <div
      className={
        compact
          ? "relative flex h-[72px] flex-col gap-1 overflow-hidden rounded bg-gradient-to-b from-[#f3f8fe] to-white py-4 pl-4 pr-4"
          : "relative flex h-[92px] flex-col gap-1 overflow-hidden rounded bg-gradient-to-b from-[#f3f8fe] to-white py-4 pl-4 pr-4"
      }
    >
      <p className="text-sm font-bold leading-5 text-[#101828]">{title}</p>
      <ArrowRightIcon size={16} className="text-[#4a5565]" />
      <Image
        src={illustration}
        alt=""
        width={compact ? 42 : 68}
        height={compact ? 42 : 68}
        className={
          compact
            ? "pointer-events-none absolute bottom-0 right-3 size-[42px] object-contain"
            : "pointer-events-none absolute bottom-0 right-3 size-[68px] object-contain"
        }
      />
    </div>
  );

  const className = "min-w-0 flex-1 rounded-lg bg-white p-1 no-underline text-inherit";
  const style = {
    boxShadow: "0px 0px 1px rgba(102, 102, 102, 0.16), 0px 4px 4px rgba(102, 102, 102, 0.12)",
  };

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${className} cursor-pointer text-left`} style={style}>
      {body}
    </button>
  );
}

/** Opens the filter panel in place; only navigates to the results page once "ตกลง" is pressed. */
function FilterEntryTile({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const isPhone = useIsMobile();
  const [open, setOpen] = useState(false);

  const handleApply = (state: MutualFundFilterState) => {
    navWrite(MUTUAL_FUND_FILTER_STATE_KEY, JSON.stringify(state));
    router.push("/product-catalog/mutual-fund/tools/filter");
  };

  return (
    <>
      <QuickActionCard
        title="ตัวกรองกองทุน"
        illustration={MF_ASSETS.filterIllustration}
        compact={compact}
        onClick={() => setOpen(true)}
      />
      {isPhone ? (
        <MutualFundFilterBottomSheet
          open={open}
          initialState={EMPTY_FILTER_STATE}
          onOpenChange={setOpen}
          onApply={handleApply}
        />
      ) : (
        <MutualFundFilterModal
          open={open}
          initialState={EMPTY_FILTER_STATE}
          onClose={() => setOpen(false)}
          onApply={handleApply}
        />
      )}
    </>
  );
}

/** Figma 40135:224276 (mobile) / 40118:77384 (desktop) */
export function MutualFundQuickActions({ className = "" }: { className?: string }) {
  return (
    <div className={`flex w-full gap-2.5 lg:gap-8 ${className}`.trim()}>
      <FilterEntryTile compact />
      <QuickActionCard
        title="วางแผนภาษี"
        illustration={MF_ASSETS.taxIllustration}
        href="/product-catalog/mutual-fund/tools/tax-planning"
        compact
      />
    </div>
  );
}

export function MutualFundQuickActionsDesktop() {
  return (
    <div className="relative hidden w-full gap-8 lg:flex">
      <FilterEntryTile />
      <QuickActionCard
        title="วางแผนภาษี"
        illustration={MF_ASSETS.taxIllustration}
        href="/product-catalog/mutual-fund/tools/tax-planning"
      />
    </div>
  );
}
