"use client";

import { useRouter } from "next/navigation";
import { FireIcon } from "@phosphor-icons/react";
import { formatAumThb } from "@/lib/client-utils";
import { CARD_SHADOW, PercentPill } from "./stock-ui";
import { stockProductHref } from "./stock-product-detail-data";
import {
  PRODUCT_TRENDING_GROUPS,
  PRODUCT_TRENDING_UPDATED_AT,
  type TrendingGroup,
  type TrendingItem,
  type TrendingTarget,
} from "./product-trending-data";
import type { CatalogNavigation } from "./ProductCatalogTab";

/** The podium reads at a glance; everything below it is just a number. */
const RANK_STYLE: Record<number, { bg: string; text: string }> = {
  1: { bg: "#fef3c6", text: "#a16207" },
  2: { bg: "#e5e7eb", text: "#4a5565" },
  3: { bg: "#ffedd4", text: "#9f4a09" },
};
const RANK_DEFAULT = { bg: "#f3f4f6", text: "#6a7282" };

function TrendingRow({
  item,
  showBorder,
  onSelect,
}: {
  item: TrendingItem;
  showBorder: boolean;
  onSelect: () => void;
}) {
  const rank = RANK_STYLE[item.rank] ?? RANK_DEFAULT;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex gap-3 items-center py-3 px-3 w-full text-left cursor-pointer transition-colors hover:bg-black/[0.02] ${
        showBorder ? "border-b border-black/10" : ""
      }`}
    >
      <span
        className="shrink-0 flex items-center justify-center size-6 rounded-full text-[12px] font-bold"
        style={{ backgroundColor: rank.bg, color: rank.text }}
      >
        {item.rank}
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-[14px] font-bold text-foreground truncate">{item.title}</span>
        <span className="type-caption text-muted-foreground truncate">{item.subtitle}</span>
      </span>
      <span className="flex flex-col items-end shrink-0 gap-0.5">
        <span className="text-[14px] font-bold text-foreground whitespace-nowrap">
          {formatAumThb(item.salesThb)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="type-caption text-muted-foreground whitespace-nowrap">
            {item.orders.toLocaleString("en-US")} ออเดอร์
          </span>
          <PercentPill trend={item.trend} value={item.changePct} size="sm" />
        </span>
      </span>
    </button>
  );
}

function TrendingGroupCard({
  group,
  onSelect,
}: {
  group: TrendingGroup;
  onSelect: (target: TrendingTarget) => void;
}) {
  return (
    <div className={`flex flex-col bg-white rounded-lg overflow-hidden ${CARD_SHADOW}`}>
      <div
        className="flex gap-2 items-center justify-between px-6 py-3 shrink-0"
        style={{ backgroundColor: "#f9f9f9" }}
      >
        <p className="font-bold text-base truncate" style={{ color: "rgba(0,0,0,0.75)" }}>
          {group.title}
        </p>
        <p className="type-caption text-muted-foreground whitespace-nowrap">
          รวม {formatAumThb(group.totalSalesThb)}
        </p>
      </div>
      <div className="flex flex-col p-3 w-full">
        {group.items.map((item, i) => (
          <TrendingRow
            key={`${group.id}-${item.rank}`}
            item={item}
            showBorder={i < group.items.length - 1}
            onSelect={() => onSelect(item.target)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Best sellers across every asset class that sells units, ranked within each.
 *
 * Takes the catalog's own navigation callbacks rather than routing on its own:
 * the same tab renders inside the client-detail page, where a product opens
 * inline instead of at a URL. Stock is the exception — it has no callback in
 * `CatalogNavigation` because `StockTab` routes to `stockProductHref` directly,
 * and this does the same.
 */
export function ProductTrendingTab({
  nav,
}: {
  nav: Pick<
    CatalogNavigation,
    | "onMutualFundSelect"
    | "onFixedIncomeBondSelect"
    | "onThaiProductSelect"
    | "onProductSelect"
    | "onGlobalBondIssuerSelect"
  >;
}) {
  const router = useRouter();

  const select = (target: TrendingTarget) => {
    switch (target.kind) {
      case "stock":
        return router.push(stockProductHref(target.symbol));
      case "mutual-fund":
        return nav.onMutualFundSelect(target.fundId);
      case "fixed-income":
        return nav.onFixedIncomeBondSelect(target.bond);
      case "thai-structured":
        return nav.onThaiProductSelect(target.product);
      case "structured":
        return nav.onProductSelect(target.product);
      case "global-bond":
        return nav.onGlobalBondIssuerSelect(target.issuerId);
    }
  };

  return (
    <div className="w-full bg-white" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="flex flex-col gap-6 max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2">
            <FireIcon size={20} weight="fill" style={{ color: "#f54a00" }} />
            <p className="font-bold text-[18px] leading-6" style={{ color: "rgba(0,0,0,0.75)" }}>
              Product Trending
            </p>
          </div>
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
            สินค้าขายดีของแต่ละสินทรัพย์ เรียงตามยอดขายสัปดาห์ล่าสุด
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {PRODUCT_TRENDING_GROUPS.map((group) => (
            <TrendingGroupCard key={group.id} group={group} onSelect={select} />
          ))}
        </div>

        <p className="type-caption text-muted-foreground text-center">
          {PRODUCT_TRENDING_UPDATED_AT}
        </p>
      </div>
    </div>
  );
}
