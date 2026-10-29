"use client";

import { useEffect, useState } from "react";
import { Button, Pagination } from "@sarunyu/system-one";
import { ArrowLeftIcon, FireIcon } from "@phosphor-icons/react";
import { formatAumThb } from "@/lib/client-utils";
import { PercentPill } from "./stock-ui";
import { TagFilterChip } from "./MutualFundCard";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  HEADER_TEXT_CLS,
  PAGE_SIZE_OPTIONS,
  SCROLLABLE_TABLE_BODY_CLS,
  TABLE_CARD_STYLE,
  cellBorderStyle,
  headerBorderStyle,
} from "./fixed-income-shared";
import {
  showsOrderCount,
  sortTrendingItems,
  TRENDING_SORTS,
  type TrendingSort,
  type TrendingGroup,
  type TrendingItem,
  type TrendingTarget,
} from "./product-trending-data";

const MIN_WIDTH = "min-w-[760px]";

/** The podium reads at a glance; everything below it is just a number. */
const RANK_STYLE: Record<number, { bg: string; text: string }> = {
  1: { bg: "#fef3c6", text: "#a16207" },
  2: { bg: "#e5e7eb", text: "#4a5565" },
  3: { bg: "#ffedd4", text: "#9f4a09" },
};
const RANK_DEFAULT = { bg: "#f3f4f6", text: "#6a7282" };

/** Shared with the cards, so a rank looks the same on both. */
export function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLE[rank] ?? RANK_DEFAULT;
  return (
    <span
      className="shrink-0 flex items-center justify-center size-6 rounded-full text-[12px] font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {rank}
    </span>
  );
}

/** Mutual Fund's View/Highlight artwork for the two editorial filters; best
 *  sellers have none, so they take the tab's own flame. */
const SORT_ICON: Record<TrendingSort, string | React.ReactNode> = {
  "best-seller": <FireIcon size={16} weight="fill" color="#f54a00" />,
  highlight: MF_ASSETS.performersTagHighlight,
  "cio-view": MF_ASSETS.performersTagView,
};

/** Pick-one sort row — Mutual Fund's tag chips, used as a segmented control. */
export function TrendingSortChips({
  value,
  onChange,
}: {
  value: TrendingSort;
  onChange: (sort: TrendingSort) => void;
}) {
  return (
    <div role="group" aria-labelledby="trending-sort-label" className="flex flex-wrap items-center gap-2">
      <span id="trending-sort-label" className="text-sm text-muted-foreground whitespace-nowrap">
        เรียงตาม
      </span>
      {TRENDING_SORTS.map((f) => (
        <TagFilterChip
          key={f.id}
          icon={SORT_ICON[f.id]}
          label={f.label}
          active={value === f.id}
          onClick={() => onChange(f.id)}
          selectedBadge={false}
        />
      ))}
    </div>
  );
}

type ColDef = {
  key: "rank" | "product" | "sales" | "orders" | "change";
  label: string;
  width: string;
  align: string;
};

const COLS: ColDef[] = [
  { key: "rank",    label: "อันดับ",       width: "w-[80px]",              align: "justify-center" },
  { key: "product", label: "สินค้า",       width: "flex-1 min-w-[300px]",  align: "" },
  { key: "sales",   label: "ยอดขาย",      width: "w-[140px]",             align: "justify-end" },
  { key: "orders",  label: "ออเดอร์",      width: "w-[120px]",             align: "justify-end" },
  { key: "change",  label: "เทียบสัปดาห์ก่อน", width: "w-[150px]",        align: "justify-end" },
];

function Cell({ item, col }: { item: TrendingItem; col: ColDef }) {
  switch (col.key) {
    case "rank":
      return <RankBadge rank={item.rank} />;
    case "product":
      return (
        <span className="flex flex-col min-w-0">
          <span className="text-sm font-bold leading-5 text-[#101828] truncate">{item.title}</span>
          <span className="type-caption text-muted-foreground truncate">{item.subtitle}</span>
        </span>
      );
    case "sales":
      return (
        <span className="text-sm font-bold leading-5 text-[#101828] whitespace-nowrap">
          {formatAumThb(item.salesThb)}
        </span>
      );
    case "orders":
      return (
        <span className="text-sm leading-5 text-[#101828] whitespace-nowrap">
          {item.orders.toLocaleString("en-US")}
        </span>
      );
    case "change":
      return <PercentPill trend={item.trend} value={item.changePct} size="sm" />;
  }
}

/**
 * One asset class's whole ranking, opened from its card's "ดูทั้งหมด".
 *
 * Same table chrome as the catalog's other full lists (`fixed-income-shared`),
 * and the same row → detail hand-off as the cards, via `onSelect`.
 */
export function ProductTrendingAllTable({
  group,
  updatedAt,
  sort,
  onSortChange,
  onBack,
  onSelect,
}: {
  group: TrendingGroup;
  updatedAt: string;
  sort: TrendingSort;
  onSortChange: (sort: TrendingSort) => void;
  onBack: () => void;
  onSelect: (target: TrendingTarget) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  // Opened from partway down the card grid — start the table at its top.
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
    else window.scrollTo(0, 0);
  }, []);

  const items = sortTrendingItems(group.items, sort);
  const cols = showsOrderCount(group.id) ? COLS : COLS.filter((c) => c.key !== "orders");
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paged = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="w-full bg-white" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="flex flex-col gap-6 max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2">
            <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
              <ArrowLeftIcon size={20} />
            </Button>
            <p className="flex-1 min-w-0 font-bold text-[18px] leading-6 truncate" style={{ color: "rgba(0,0,0,0.75)" }}>
              Product Trending · {group.title}
            </p>
          </div>
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
            {updatedAt}
          </p>
        </div>

        <TrendingSortChips
          value={sort}
          onChange={(next) => {
            onSortChange(next);
            setCurrentPage(1);
          }}
        />

        <div className="flex flex-col gap-3">
          {/* No order count for desks that open a single round — see `showsOrderCount`. */}
          <div className="w-full rounded-xl bg-white" style={TABLE_CARD_STYLE}>
            <div className={SCROLLABLE_TABLE_BODY_CLS}>
              <div className={`flex h-11 items-stretch ${MIN_WIDTH}`}>
                {cols.map((col, i) => (
                  <div
                    key={col.key}
                    className={`flex ${col.width} shrink-0 items-center ${col.align} px-3`}
                    style={headerBorderStyle(i === cols.length - 1 ? { right: false } : undefined)}
                  >
                    <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{col.label}</span>
                  </div>
                ))}
              </div>
              <div className={`flex flex-col ${MIN_WIDTH}`}>
                {paged.map((item, i) => (
                  <button
                    key={item.rank}
                    type="button"
                    onClick={() => onSelect(item.target)}
                    className="flex items-stretch w-full text-left bg-white cursor-pointer transition-colors hover:bg-[#f9fafb]"
                  >
                    {cols.map((col) => (
                      <div
                        key={col.key}
                        className={`flex ${col.width} shrink-0 items-center ${col.align} px-3 py-3 min-w-0`}
                        style={cellBorderStyle({ bottom: i < paged.length - 1 })}
                      >
                        <Cell item={item} col={col} />
                      </div>
                    ))}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap-reverse items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <p className="text-[12px] text-muted-foreground whitespace-nowrap">Show per page</p>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="text-[12px] border border-border rounded-md px-2 py-1 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-action"
              >
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[12px] text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">{(safePage - 1) * pageSize + 1}</span>
                {" – "}
                <span className="font-medium text-foreground">{Math.min(safePage * pageSize, total)}</span>
                {" of "}
                <span className="font-medium text-foreground">{total}</span>{" "}
                items
              </p>
              <Pagination totalPages={totalPages} currentPage={safePage} onPageChange={setCurrentPage} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
