/**
 * Product Catalog → Product Trending: what is actually selling, ranked.
 *
 * Mock sales figures, real products. The names, ids and detail targets are
 * pulled from the same datasets the individual catalog tabs render, so every
 * row here links somewhere that exists — when a product is renamed or dropped,
 * this list follows instead of rotting into a page of dead links. Only the
 * money is invented: `SALES_LADDER` below.
 *
 * Portfolio Advisory is deliberately absent — it sells plans built per client,
 * not units off a shelf, so it has no "best seller" to rank. TFEX is absent
 * too, for the plainer reason that the catalog has no TFEX products yet.
 */
import { FIXED_INCOME_BONDS, type FixedIncomeBond } from "./fixed-income-data";
import {
  ALL_OVERSEAS_BONDS,
  getIssuerIdForBondRow,
  type GlobalBondIssuerId,
} from "./global-bond-data";
import { getTopPerformers } from "./mutual-fund-data";
import { STOCK_TOP_PICK, type Trend } from "./stock-data";
import { getSectorStockBatch } from "./stock-industry-sector-data";
import {
  STRUCTURED_PRODUCTS,
  TOP_PICKS,
  type StructuredProduct,
} from "./structured-product-data";
import { THAI_STRUCTURED_PRODUCTS, type ThaiStructuredProduct } from "./thai-structured-data";

/** Where a trending row goes when clicked. Mirrors `CatalogNavigation`'s
 *  callbacks so the tab can hand each kind to the handler that already knows
 *  how to open it — in the full-page catalog *and* in the client-detail
 *  embedding, which opens details inline rather than routing. */
export type TrendingTarget =
  | { kind: "stock"; symbol: string }
  | { kind: "mutual-fund"; fundId: string }
  | { kind: "fixed-income"; bond: FixedIncomeBond }
  | { kind: "thai-structured"; product: ThaiStructuredProduct }
  | { kind: "structured"; product: StructuredProduct }
  | { kind: "global-bond"; issuerId: GlobalBondIssuerId };

export type TrendingItem = {
  /** 1-based, within its own asset class. */
  rank: number;
  title: string;
  subtitle: string;
  /** Mock sales for the week, in THB. Formatted at the edge, not here. */
  salesThb: number;
  /** Mock number of orders that made up `salesThb`. */
  orders: number;
  /** Week-on-week change in sales, pre-formatted with its sign. */
  changePct: string;
  trend: Trend;
  /** Mock: picked by Yuanta's desk — rises to the top under "Yuanta Highlight". */
  highlight: boolean;
  /** Mock: in line with the CIO's house view — rises to the top under "CIO View". */
  cioView: boolean;
  target: TrendingTarget;
};

export type TrendingGroup = {
  /** A `PRODUCT_CATEGORIES` id — the tab this group's products live under. */
  id: string;
  title: string;
  /** Every product in the class, ranked. The card shows the first
   *  `TRENDING_CARD_ROWS`; "ดูทั้งหมด" opens the whole list as a table. */
  items: TrendingItem[];
};

/**
 * Whether a group's rows show their order count.
 *
 * Not for the booked desks — structured products and bonds open once and close
 * (on a full basket or a used-up quota), so "how many orders" is a count of one
 * round's clients, not a measure of how well it sells. Stock and mutual funds
 * trade continuously, where the count does say something.
 */
const SINGLE_ROUND_GROUPS = new Set(["structured", "thai-structured", "global-bond", "fixed-income"]);

export function showsOrderCount(groupId: string): boolean {
  return !SINGLE_ROUND_GROUPS.has(groupId);
}

/** How many of a group's rows its card shows before "ดูทั้งหมด". */
export const TRENDING_CARD_ROWS = 5;

export const PRODUCT_TRENDING_UPDATED_AT =
  "ยอดขาย 7 วันล่าสุด | Latest update: 30 Apr 2025 - 09:22";

/**
 * The invented part: five rungs of [sales THB, orders, week-on-week] per asset
 * class, descending — so the rank a row is given and the number printed beside
 * it always agree. Scales differ by asset class on purpose: a structured note
 * sells in far fewer, far larger tickets than a mutual fund.
 */
const SALES_LADDER: Record<string, [salesThb: number, orders: number, changePct: string, trend: Trend][]> = {
  "mutual-fund": [
    [1_482_000_000, 2_418, "+18.4%", "up"],
    [1_126_000_000, 1_974, "+11.2%", "up"],
    [884_000_000, 1_503, "+6.8%", "up"],
    [612_000_000, 1_142, "-3.1%", "down"],
    [471_000_000, 905, "+2.4%", "up"],
  ],
  structured: [
    [1_205_000_000, 164, "+24.6%", "up"],
    [948_000_000, 131, "+9.9%", "up"],
    [702_000_000, 98, "+4.2%", "up"],
    [536_000_000, 74, "-8.5%", "down"],
    [388_000_000, 52, "0.0%", "flat"],
  ],
  "fixed-income": [
    [967_000_000, 486, "+14.1%", "up"],
    [743_000_000, 402, "+7.7%", "up"],
    [598_000_000, 331, "-2.3%", "down"],
    [455_000_000, 268, "+3.9%", "up"],
    [312_000_000, 190, "-5.6%", "down"],
  ],
  "thai-structured": [
    [845_000_000, 122, "+31.8%", "up"],
    [664_000_000, 97, "+12.5%", "up"],
    [521_000_000, 79, "+5.1%", "up"],
    [402_000_000, 61, "-4.8%", "down"],
    [287_000_000, 44, "+1.6%", "up"],
  ],
  "global-bond": [
    [732_000_000, 214, "+9.2%", "up"],
    [585_000_000, 176, "+6.4%", "up"],
    [441_000_000, 138, "-1.9%", "down"],
    [329_000_000, 102, "+4.7%", "up"],
    [246_000_000, 77, "-7.2%", "down"],
  ],
  stock: [
    [518_000_000, 3_142, "+21.3%", "up"],
    [402_000_000, 2_576, "+8.8%", "up"],
    [341_000_000, 2_104, "-4.4%", "down"],
    [275_000_000, 1_688, "+2.7%", "up"],
    [198_000_000, 1_245, "-9.1%", "down"],
  ],
};

/**
 * Rungs past the hand-written five, for the full table: each one a step down
 * from the last written rung, so the ranking still reads top-down. The
 * week-on-week figures cycle through a fixed list — deterministic, so the
 * table doesn't reshuffle between renders.
 */
const TAIL_DECAY = 0.86;
const TAIL_CHANGES: [changePct: string, trend: Trend][] = [
  ["+3.2%", "up"],
  ["-1.8%", "down"],
  ["+0.9%", "up"],
  ["0.0%", "flat"],
  ["-4.1%", "down"],
  ["+5.6%", "up"],
  ["-0.7%", "down"],
];

function rung(ladder: (typeof SALES_LADDER)[string], i: number) {
  if (i < ladder.length) return ladder[i];
  const [lastSales, lastOrders] = ladder[ladder.length - 1];
  const factor = TAIL_DECAY ** (i - ladder.length + 1);
  const [changePct, trend] = TAIL_CHANGES[(i - ladder.length) % TAIL_CHANGES.length];
  return [
    Math.round((lastSales * factor) / 1_000_000) * 1_000_000,
    Math.max(1, Math.round(lastOrders * factor)),
    changePct,
    trend,
  ] as const;
}

function dedupeBy<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    const key = keyOf(item);
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}

/** Pairs the real products of one asset class with that class's sales ladder. */
function group<T>(
  id: string,
  title: string,
  source: T[],
  row: (item: T) => { title: string; subtitle: string; target: TrendingTarget },
): TrendingGroup {
  const ladder = SALES_LADDER[id];
  const items = source.map((item, i) => {
    const [salesThb, orders, changePct, trend] = rung(ladder, i);
    return {
      rank: i + 1,
      salesThb,
      orders,
      changePct,
      trend,
      // Invented like the sales: a fixed pattern, so the two editorial sorts
      // don't lift the same rows.
      highlight: i % 2 === 0,
      cioView: i % 3 !== 1,
      ...row(item),
    };
  });
  return { id, title, items };
}

const globalBondRows = dedupeBy(
  ALL_OVERSEAS_BONDS.filter((bond) => getIssuerIdForBondRow(bond) !== undefined),
  (bond) => bond.name,
);

const stockRows = dedupeBy(
  [...STOCK_TOP_PICK, ...getSectorStockBatch(0, 10)],
  (row) => row.symbol,
);

const structuredRows = dedupeBy([...TOP_PICKS, ...STRUCTURED_PRODUCTS], (p) => p.id);

/**
 * Card order on the page — a layout decision, not a ranking, so it is written
 * out rather than derived from the numbers. What it is built around: the two
 * structured-product cards sit side by side on the two-column grid (same
 * instrument in two markets — an IC comparing Thai against Global shouldn't
 * have to read down a column to do it), and the two flagship retail products,
 * Stock and Mutual Fund, open the page as the top row. Any id missing here
 * sorts to the end.
 */
const GROUP_ORDER = [
  "stock",
  "mutual-fund",
  "structured",
  "thai-structured",
  "global-bond",
  "fixed-income",
];

function orderOf(id: string): number {
  const i = GROUP_ORDER.indexOf(id);
  return i === -1 ? GROUP_ORDER.length : i;
}

/** Every asset class that sells units, each ranked internally by sales. */
export const PRODUCT_TRENDING_GROUPS: TrendingGroup[] = [
  // Top picks lead (they are the card's five); the SET sector stocks follow so
  // the full table has more than the card. Both resolve on `stockProductHref`
  // — `getStockProductDetail` searches the same sector batch.
  group("stock", "Stock", stockRows, (row) => ({
    title: row.symbol,
    subtitle: row.name,
    target: { kind: "stock", symbol: row.symbol },
  })),
  group(
    "mutual-fund",
    "Mutual Fund",
    dedupeBy(getTopPerformers("global-equity"), (fund) => fund.id),
    (fund) => ({
      title: fund.symbol,
      subtitle: fund.name,
      target: { kind: "mutual-fund", fundId: fund.id },
    }),
  ),
  group("fixed-income", "Fixed Income", dedupeBy(FIXED_INCOME_BONDS, (b) => b.symbol), (bond) => ({
    title: bond.symbol,
    subtitle: `${bond.companyName} · YTM ${bond.ytm}`,
    target: { kind: "fixed-income", bond },
  })),
  // The basket leads and the theme follows, matching the Global Structured
  // rows above and the All Thai FCN table's own columns — "Chips" names a
  // shelf, AMD/NVDA/QCOM is the thing being sold.
  group("thai-structured", "Thai Structured Product", THAI_STRUCTURED_PRODUCTS, (product) => ({
    title: [product.bbg1, product.bbg2, product.bbg3].filter(Boolean).join(" - "),
    subtitle: `${product.theme} · ${product.product} · Coupon ${product.couponPa} · ${product.tenor}M`,
    target: { kind: "thai-structured", product },
  })),
  // Underlying first, unlike the search index's productName-first rows: every
  // product here is a "Global FCN", so the basket is the only thing that tells
  // one rank from the next.
  group("structured", "Global Structured Product", structuredRows, (product) => ({
    title: product.underlying,
    subtitle: `${product.productName} · Coupon ${product.coupon}`,
    target: { kind: "structured", product },
  })),
  group("global-bond", "Global Bond", globalBondRows, (bond) => ({
    title: bond.name,
    subtitle: `${bond.currency} · Yield ${bond.yieldPct} · Maturity ${bond.maturity}`,
    // Narrowed by the `filter` that built `globalBondRows`.
    target: { kind: "global-bond", issuerId: getIssuerIdForBondRow(bond)! },
  })),
].sort((a, b) => orderOf(a.id) - orderOf(b.id));

export function getTrendingGroup(id: string): TrendingGroup | undefined {
  return PRODUCT_TRENDING_GROUPS.find((g) => g.id === id);
}

/** `?sort=` — omitted from the URL while it holds its default value. */
export const TRENDING_SORT_PARAM = "sort";

export type TrendingSort = "best-seller" | "highlight" | "cio-view";

export const DEFAULT_TRENDING_SORT: TrendingSort = "best-seller";

export const TRENDING_SORTS: { id: TrendingSort; label: string }[] = [
  { id: "best-seller", label: "รายการขายดี" },
  { id: "highlight", label: "Yuanta Highlight" },
  { id: "cio-view", label: "CIO View" },
];

export function normalizeTrendingSort(value: string | null | undefined): TrendingSort {
  return TRENDING_SORTS.some((f) => f.id === value)
    ? (value as TrendingSort)
    : DEFAULT_TRENDING_SORT;
}

/**
 * A group's rows in the order a sort asks for, re-ranked 1..n so the podium
 * follows it.
 *
 * Reorders, never drops: this tab is the IC's full shelf — everything the desk
 * can sell, not the narrower set a client sees in the asset tabs beside it.
 * The editorial sorts lift their picks to the top (by sales among themselves)
 * and leave the rest below, still by sales.
 */
export function sortTrendingItems(items: TrendingItem[], sort: TrendingSort): TrendingItem[] {
  if (sort === "best-seller") return items;
  const picked = sort === "highlight" ? (i: TrendingItem) => i.highlight : (i: TrendingItem) => i.cioView;
  return [...items.filter(picked), ...items.filter((i) => !picked(i))].map((item, i) => ({
    ...item,
    rank: i + 1,
  }));
}

/** A group's full ranking — the sub-page its card's "ดูทั้งหมด" opens. */
export function trendingGroupHref(id: string, sort: TrendingSort = DEFAULT_TRENDING_SORT): string {
  const path = `/product-catalog/product-trending/${encodeURIComponent(id)}`;
  return sort === DEFAULT_TRENDING_SORT ? path : `${path}?${TRENDING_SORT_PARAM}=${sort}`;
}
