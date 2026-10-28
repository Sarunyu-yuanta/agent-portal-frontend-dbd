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
  target: TrendingTarget;
};

export type TrendingGroup = {
  /** A `PRODUCT_CATEGORIES` id — the tab this group's products live under. */
  id: string;
  title: string;
  items: TrendingItem[];
  /** Sum of the group's rows, for the card header and the group ordering. */
  totalSalesThb: number;
};

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

const ROWS_PER_GROUP = 5;

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
  const items = source.slice(0, ROWS_PER_GROUP).map((item, i) => {
    const [salesThb, orders, changePct, trend] = ladder[i];
    return { rank: i + 1, salesThb, orders, changePct, trend, ...row(item) };
  });
  return {
    id,
    title,
    items,
    totalSalesThb: items.reduce((sum, item) => sum + item.salesThb, 0),
  };
}

const globalBondRows = dedupeBy(
  ALL_OVERSEAS_BONDS.filter((bond) => getIssuerIdForBondRow(bond) !== undefined),
  (bond) => bond.name,
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
  group("stock", "Stock", STOCK_TOP_PICK, (row) => ({
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
