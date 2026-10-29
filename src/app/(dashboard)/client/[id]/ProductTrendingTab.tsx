"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@sarunyu/system-one";
import { FireIcon } from "@phosphor-icons/react";
import { formatAumThb } from "@/lib/client-utils";
import { CARD_SHADOW, PercentPill } from "./stock-ui";
import { stockProductHref } from "./stock-product-detail-data";
import { RankBadge, TrendingSortChips } from "./ProductTrendingAllTable";
import { setQueryState, withQuery } from "@/lib/query-state";
import {
  PRODUCT_TRENDING_GROUPS,
  PRODUCT_TRENDING_UPDATED_AT,
  DEFAULT_TRENDING_SORT,
  sortTrendingItems,
  normalizeTrendingSort,
  TRENDING_CARD_ROWS,
  showsOrderCount,
  TRENDING_SORT_PARAM,
  type TrendingSort,
  type TrendingGroup,
  type TrendingItem,
  type TrendingTarget,
} from "./product-trending-data";
import type { CatalogNavigation } from "./ProductCatalogTab";

function TrendingRow({
  item,
  showBorder,
  showOrders,
  onSelect,
}: {
  item: TrendingItem;
  showBorder: boolean;
  /** See `showsOrderCount`. */
  showOrders: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex gap-3 items-center py-3 px-3 w-full text-left cursor-pointer transition-colors hover:bg-black/[0.02] ${
        showBorder ? "border-b border-black/10" : ""
      }`}
    >
      <RankBadge rank={item.rank} />
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-[14px] font-bold text-foreground truncate">{item.title}</span>
        <span className="type-caption text-muted-foreground truncate">{item.subtitle}</span>
      </span>
      <span className="flex flex-col items-end shrink-0 gap-0.5">
        <span className="text-[14px] font-bold text-foreground whitespace-nowrap">
          {formatAumThb(item.salesThb)}
        </span>
        <span className="flex items-center gap-1.5">
          {showOrders && (
            <span className="type-caption text-muted-foreground whitespace-nowrap">
              {item.orders.toLocaleString("en-US")} ออเดอร์
            </span>
          )}
          <PercentPill trend={item.trend} value={item.changePct} size="sm" />
        </span>
      </span>
    </button>
  );
}

function TrendingGroupCard({
  group,
  items,
  onSelect,
  onViewAll,
}: {
  group: TrendingGroup;
  /** The group's rows in the active sort's order. */
  items: TrendingItem[];
  onSelect: (target: TrendingTarget) => void;
  onViewAll: () => void;
}) {
  const shown = items.slice(0, TRENDING_CARD_ROWS);
  return (
    <div className={`flex flex-col bg-white rounded-lg overflow-hidden ${CARD_SHADOW}`}>
      <div
        className="flex gap-2 items-center justify-between px-6 h-12 shrink-0"
        style={{ backgroundColor: "#f9f9f9" }}
      >
        <p className="font-bold text-base truncate" style={{ color: "rgba(0,0,0,0.75)" }}>
          {group.title}
        </p>
        {items.length > TRENDING_CARD_ROWS && (
          <Button variant="plain" size="sm" onClick={onViewAll}>
            ดูทั้งหมด
          </Button>
        )}
      </div>
      <div className="flex flex-col p-3 w-full">
        {shown.map((item, i) => (
          <TrendingRow
            key={`${group.id}-${item.rank}`}
            item={item}
            showBorder={i < shown.length - 1}
            showOrders={showsOrderCount(group.id)}
            onSelect={() => onSelect(item.target)}
          />
        ))}
      </div>
    </div>
  );
}

type TrendingNav = Pick<
  CatalogNavigation,
  | "onMutualFundSelect"
  | "onFixedIncomeBondSelect"
  | "onThaiProductSelect"
  | "onProductSelect"
  | "onGlobalBondIssuerSelect"
>;

/**
 * Opens a trending row's product. Shared by the cards and the "ดูทั้งหมด"
 * sub-page so both hand each kind to the same place.
 *
 * Takes the catalog's own navigation callbacks rather than routing on its own:
 * the catalog falls back to opening details inline when it has no URL
 * navigation. Stock is the exception — it has no callback in
 * `CatalogNavigation` because `StockTab` routes to `stockProductHref` directly,
 * and this does the same.
 */
export function useTrendingSelect(nav: TrendingNav) {
  const router = useRouter();
  return (target: TrendingTarget) => {
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
}

/**
 * Best sellers across every asset class that sells units, ranked within each.
 *
 * IC-only: unlike the asset tabs beside it, which show what a client would
 * see, this lists every product the desk can sell — so an IC can find one
 * here and then point the client to it in that client-facing tab.
 */
export function ProductTrendingTab({
  nav,
}: {
  nav: TrendingNav & Pick<CatalogNavigation, "onTrendingSeeAll">;
}) {
  const select = useTrendingSelect(nav);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = normalizeTrendingSort(searchParams.get(TRENDING_SORT_PARAM));
  const setSort = (next: TrendingSort) =>
    setQueryState(
      withQuery(pathname, searchParams, {
        [TRENDING_SORT_PARAM]: next === DEFAULT_TRENDING_SORT ? null : next,
      }),
    );
  const groups = PRODUCT_TRENDING_GROUPS.map((group) => ({
    group,
    items: sortTrendingItems(group.items, sort),
  }));

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

        <TrendingSortChips value={sort} onChange={setSort} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {groups.map(({ group, items }) => (
            <TrendingGroupCard
              key={group.id}
              group={group}
              items={items}
              onSelect={select}
              onViewAll={() => nav.onTrendingSeeAll(group.id, sort)}
            />
          ))}
        </div>

        <p className="type-caption text-muted-foreground text-center">
          {PRODUCT_TRENDING_UPDATED_AT}
        </p>
      </div>
    </div>
  );
}
