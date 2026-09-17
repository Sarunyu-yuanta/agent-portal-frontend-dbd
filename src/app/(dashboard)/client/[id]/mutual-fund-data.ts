import mutualFundsRaw from "@/data/mutual-funds.json";
import navHistoryRaw from "@/data/mutual-fund-nav-history.json";

export type MutualFundCategoryId =
  | "global-equity"
  | "thai-equity"
  | "us-equity"
  | "japan-equity"
  | "europe-equity"
  | "emerging-equity"
  | "fixed-income"
  | "global-fixed-income"
  | "reits"
  | "commodities"
  | "gold";

export type MutualFundThemeId = "ai" | "finance" | "tech" | "energy" | "health";

export type MutualFundThemeIcon = "head-circuit" | "bank" | "cpu" | "rocket-launch" | "cube";

export type MutualFund = {
  id: string;
  symbol: string;
  name: string;
  risk: number;
  price: string;
  currency: string;
  changeAbs: string;
  changePct: string;
  isPick: boolean;
};

export type MutualFundCategory = {
  id: MutualFundCategoryId;
  label: string;
};

export type MutualFundInsight = {
  id: string;
  /** House View strategy id — links to `/insights/[detailId]`. */
  detailId: string;
  title: string;
  date: string;
  recommendedFunds: string[];
};

export type MutualFundTheme = {
  id: MutualFundThemeId;
  title: string;
  icon: MutualFundThemeIcon;
  funds: MutualFund[];
};

export type MutualFundHistoricalReturn = {
  period: string;
  value: string;
};

export type MutualFundPerformanceReturn = {
  period: string;
  return: string;
  volatility: string;
  maxDrawdown: string;
};

export type MutualFundAllocationItem = {
  label: string;
  percent: number;
  color?: string;
};

export type MutualFundTradingInfo = {
  minInitialPurchase: string;
  minSubsequentPurchase: string;
  minRedemption: string;
  purchaseCutoff: string;
  redemptionCutoff: string;
  settlementDays: string;
};

export type MutualFundFeeDetail = {
  label: string;
  actual: string;
  maximum: string;
};

export type MutualFundFees = {
  frontEnd: string;
  backEnd: string;
  management: string;
};

export type MutualFundDividend = {
  bookCloseDate: string;
  paymentDate: string;
  amountPerUnit: string;
};

export type MutualFundInfo = {
  prospectusUrl: string;
  managementCompany: string;
  fundType: string;
  taxBenefit: string;
  foreignInvestment: string;
  fxRiskPolicy: string;
  riskScore: number;
  dividendPolicy: string;
  currencyPolicy: string;
  managementFee: string;
  minimumInvestment: string;
  registrationDate: string;
  netAssetValue: string;
};

export type MutualFundDetailFields = {
  nav: string;
  navDate: string;
  changePct: string;
  fxRisk: string;
  acceptsCreditCard: boolean;
  investmentPolicy: string;
  fees: MutualFundFees;
  dividend?: MutualFundDividend;
  historicalReturns: MutualFundHistoricalReturn[];
  performanceReturns: MutualFundPerformanceReturn[];
  dividendHistory: MutualFundDividend[];
  topHoldings: MutualFundAllocationItem[];
  assetAllocation: MutualFundAllocationItem[];
  tradingInfo: MutualFundTradingInfo;
  feeDetails: MutualFundFeeDetail[];
  fundInfo: MutualFundInfo;
};

export type MutualFundDetail = MutualFund & MutualFundDetailFields;

export type MutualFundCatalog = {
  categories: MutualFundCategory[];
  topPerformers: Partial<Record<MutualFundCategoryId, MutualFund[]>>;
  insights: MutualFundInsight[];
  themes: MutualFundTheme[];
  fundDetails: Partial<Record<string, MutualFundDetailFields>>;
};

export const MUTUAL_FUND_CATALOG = mutualFundsRaw as MutualFundCatalog;

export const MUTUAL_FUND_CATEGORIES = MUTUAL_FUND_CATALOG.categories;

/** Figma 39889:665476 — performers list tabs (no ตราสารหนี้ต่างประเทศ). */
export const TOP_PERFORMERS_TAB_CATEGORIES = MUTUAL_FUND_CATEGORIES.filter(
  (c) => c.id !== "global-fixed-income",
);

export function getTopPerformers(categoryId: MutualFundCategoryId): MutualFund[] {
  return (
    MUTUAL_FUND_CATALOG.topPerformers[categoryId] ??
    MUTUAL_FUND_CATALOG.topPerformers["global-equity"] ??
    []
  );
}

/** Figma 39889:665484 — performers list as-of date. */
export const TOP_PERFORMERS_LIST_UPDATED_AT = "2 ส.ค 69";

/** Figma 39889:667557 — total catalog count (mock). */
export const TOP_PERFORMERS_DISPLAY_COUNT = 160;

export const MUTUAL_FUND_PERFORMANCE_PERIODS = [
  "1M",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "3Y",
  "5Y",
  "MAX",
] as const;

export type MutualFundPerformancePeriod = (typeof MUTUAL_FUND_PERFORMANCE_PERIODS)[number];

/** Figma 39839:522570 (mobile) — tab bar groups several desktop categories under one tab. */
export type MobileFundGroupId =
  | "all"
  | "fixed-income"
  | "global-fixed-income"
  | "thai-equity"
  | "foreign-equity"
  | "commodities-group"
  | "tax-saving"
  | "others";

export type MobileFundGroup = {
  id: MobileFundGroupId;
  label: string;
  /** Underlying categories this group pools funds from; omitted (tax-saving/others) means no catalog data exists yet. */
  categoryIds?: MutualFundCategoryId[];
};

export const MOBILE_FUND_GROUPS: MobileFundGroup[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "fixed-income", label: "ตราสารหนี้ไทย", categoryIds: ["fixed-income"] },
  { id: "global-fixed-income", label: "ตราสารหนี้ต่างประเทศ", categoryIds: ["global-fixed-income"] },
  { id: "thai-equity", label: "หุ้นไทย", categoryIds: ["thai-equity"] },
  {
    id: "foreign-equity",
    label: "หุ้นต่างประเทศ",
    categoryIds: ["global-equity", "us-equity", "japan-equity", "europe-equity", "emerging-equity"],
  },
  { id: "commodities-group", label: "Commodities", categoryIds: ["reits", "commodities", "gold"] },
  { id: "tax-saving", label: "ลดหย่อนภาษี" },
  { id: "others", label: "อื่นๆ" },
];

/** Funds for a mobile tab — pools every underlying category, deduped by fund id. */
export function getMobileGroupFunds(groupId: MobileFundGroupId): MutualFund[] {
  const group = MOBILE_FUND_GROUPS.find((g) => g.id === groupId);
  const categoryIds = groupId === "all" ? MUTUAL_FUND_CATEGORIES.map((c) => c.id) : (group?.categoryIds ?? []);

  const byId = new Map<string, MutualFund>();
  for (const categoryId of categoryIds) {
    for (const fund of getTopPerformers(categoryId)) {
      byId.set(fund.id, fund);
    }
  }
  return [...byId.values()];
}

/** Figma mobile period tabs — different set from desktop (adds 1D/1W, drops 3Y/5Y/MAX). */
export const MOBILE_PERFORMANCE_PERIODS = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y"] as const;

export type MobilePerformancePeriod = (typeof MOBILE_PERFORMANCE_PERIODS)[number];

export function normalizeMutualFundCategoryId(value: string): MutualFundCategoryId {
  if (value === "global-fixed-income") return "fixed-income";
  return MUTUAL_FUND_CATEGORIES.some((c) => c.id === value)
    ? (value as MutualFundCategoryId)
    : "global-equity";
}

/** Which mobile tab group a route param falls under — accepts either a group id directly (e.g. "commodities-group") or a single category id (e.g. "us-equity", deep-linked from the catalog grid), so any prior link still lands on the right tab. */
export function resolveMobileFundGroupId(value: string): MobileFundGroupId {
  const direct = MOBILE_FUND_GROUPS.find((g) => g.id === value);
  if (direct) return direct.id;
  const categoryId = normalizeMutualFundCategoryId(value);
  const group = MOBILE_FUND_GROUPS.find((g) => g.categoryIds?.includes(categoryId));
  return group?.id ?? "all";
}

export function mutualFundCategoryHref(categoryId: MutualFundCategoryId): string {
  return `/product-catalog/mutual-fund/top-performers/${encodeURIComponent(categoryId)}`;
}

export function mutualFundGroupHref(groupId: MobileFundGroupId): string {
  return `/product-catalog/mutual-fund/top-performers/${encodeURIComponent(groupId)}`;
}

export function mutualFundInsightsHref(): string {
  return "/product-catalog/mutual-fund/insights";
}

export function mutualFundInsightDetailHref(detailId: string): string {
  return `/insights/${encodeURIComponent(detailId)}`;
}

/** Figma 38285:291118 — insights list grid page size. */
export const MUTUAL_FUND_INSIGHTS_PAGE_SIZE = 8;

/** Figma pagination mock — 10 pages × 8 cards. */
export const MUTUAL_FUND_INSIGHTS_MOCK_TOTAL = 80;

function cycleInsightsToCount(items: MutualFundInsight[], targetCount: number): MutualFundInsight[] {
  if (items.length === 0) return [];
  const out: MutualFundInsight[] = [];
  for (let i = 0; i < targetCount; i += 1) {
    const source = items[i % items.length];
    out.push({ ...source, id: `${source.id}-${i}` });
  }
  return out;
}

export function getMutualFundInsightsCatalog(): MutualFundInsight[] {
  return cycleInsightsToCount(MUTUAL_FUND_CATALOG.insights, MUTUAL_FUND_INSIGHTS_MOCK_TOTAL);
}

export function getMutualFundInsightsPage(
  page: number,
  pageSize = MUTUAL_FUND_INSIGHTS_PAGE_SIZE,
): {
  items: MutualFundInsight[];
  totalPages: number;
  currentPage: number;
} {
  const all = getMutualFundInsightsCatalog();
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: all.slice(start, start + pageSize),
    totalPages,
    currentPage,
  };
}

/** Full list for performers page — category slice plus catalog funds for a fuller grid. */
/** Tile funds for list grid density (Figma shows 16+ cards). */
export function getTopPerformersGridFunds(
  categoryId: MutualFundCategoryId,
  pickOnly: boolean,
  targetCount = 16,
): MutualFund[] {
  const base = getTopPerformersList(categoryId);
  return cycleToCount(pickOnly ? base.filter((f) => f.isPick) : base, targetCount);
}

/** Same density cycling as getTopPerformersGridFunds, for a mobile tab group. */
export function getMobileGroupGridFunds(
  groupId: MobileFundGroupId,
  pickOnly: boolean,
  targetCount = 16,
): MutualFund[] {
  const base = getMobileGroupFunds(groupId);
  return cycleToCount(pickOnly ? base.filter((f) => f.isPick) : base, targetCount);
}

function cycleToCount(funds: MutualFund[], targetCount: number): MutualFund[] {
  if (funds.length === 0) return [];
  const out: MutualFund[] = [];
  for (let i = 0; i < targetCount; i += 1) {
    out.push(funds[i % funds.length]);
  }
  return out;
}

/** Category slice only — performers list page order matches Figma grid. */
export function getTopPerformersList(categoryId: MutualFundCategoryId): MutualFund[] {
  return getTopPerformers(categoryId);
}

/** Figma 39839:525396 — theme detail page ("ดูเพิ่มเติม" destination) tabs, in card order. */
export const MUTUAL_FUND_THEME_IDS: MutualFundThemeId[] = MUTUAL_FUND_CATALOG.themes.map((t) => t.id);

export function getMutualFundTheme(themeId: MutualFundThemeId): MutualFundTheme {
  return MUTUAL_FUND_CATALOG.themes.find((t) => t.id === themeId) ?? MUTUAL_FUND_CATALOG.themes[0];
}

export function normalizeMutualFundThemeId(value: string): MutualFundThemeId {
  return MUTUAL_FUND_CATALOG.themes.some((t) => t.id === value)
    ? (value as MutualFundThemeId)
    : MUTUAL_FUND_CATALOG.themes[0].id;
}

export function mutualFundThemeHref(themeId: MutualFundThemeId): string {
  return `/product-catalog/mutual-fund/themes/${encodeURIComponent(themeId)}`;
}

/** Same density cycling as getTopPerformersGridFunds, for a theme's fund pool. */
export function getThemeGridFunds(themeId: MutualFundThemeId, pickOnly: boolean, targetCount = 16): MutualFund[] {
  const base = getMutualFundTheme(themeId).funds;
  return cycleToCount(pickOnly ? base.filter((f) => f.isPick) : base, targetCount);
}

/** Figma 39839:525396 hero heading — the English business name shown above each theme's description. */
const THEME_HERO_TITLES: Record<MutualFundThemeId, string> = {
  ai: "Semiconductor & Memory",
  finance: "Global Financial Services",
  tech: "Cybersecurity",
  energy: "Metals & Mining",
  health: "Defense",
};

export function getThemeHeroTitle(themeId: MutualFundThemeId): string {
  return THEME_HERO_TITLES[themeId] ?? "";
}

/** Figma 39839:525396 hero subtitle. */
const THEME_DESCRIPTIONS: Record<MutualFundThemeId, string> = {
  ai: "ผู้ผลิตชิปและหน่วยความจำ ฮาร์ดแวร์เบื้องหลัง AI",
  finance: "ธนาคารและบริการทางการเงินโลก",
  tech: "ซอฟต์แวร์ความปลอดภัยไซเบอร์และซอฟต์แวร์องค์กร",
  energy: "เหมืองแร่โลหะมีค่าและโลหะยุทธศาสตร์ ทั่วโลก",
  health: "อุตสาหกรรมกลาโหมโลก และโดรนทางทหาร",
};

export function getThemeDescription(themeId: MutualFundThemeId): string {
  return THEME_DESCRIPTIONS[themeId] ?? "";
}

/** Figma 39910:727252 — "ตัวกรอง" filter panel: category chips (catalog categories plus a UI-only "อื่นๆ"). */
export type FilterCategoryOption = { id: string; label: string };
export const FILTER_CATEGORY_OPTIONS: FilterCategoryOption[] = [
  ...MUTUAL_FUND_CATEGORIES.map((c) => ({ id: c.id as string, label: c.label })),
  { id: "others", label: "อื่นๆ" },
];

export const TAX_SAVING_FUND_TYPES = ["RMF", "TESG", "TESGX"] as const;
export type TaxSavingFundType = (typeof TAX_SAVING_FUND_TYPES)[number];

export function normalizeTaxSavingFundType(value: string): TaxSavingFundType {
  const upper = value.toUpperCase();
  return (TAX_SAVING_FUND_TYPES as readonly string[]).includes(upper)
    ? (upper as TaxSavingFundType)
    : "RMF";
}

export const DIVIDEND_POLICY_OPTIONS = ["จ่าย", "ไม่จ่าย"] as const;
export const INVESTMENT_POLICY_OPTIONS = ["เชิงรุก", "เชิงรับ"] as const;
export const FUND_RISK_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Figma 39910:727252 — "บริษัทจัดการกองทุน" chip row; icon looked up via MF_ASSETS.amcLogo[id]. */
export const FUND_MANAGEMENT_COMPANIES = [
  { id: "kasset", label: "KASSET" },
  { id: "daolinv", label: "DAOLINV" },
  { id: "talisam", label: "TALISAM" },
  { id: "bblam", label: "BBLAM" },
  { id: "ksam", label: "KSAM" },
  { id: "ktam", label: "KTAM" },
  { id: "bcap", label: "BCAP" },
  { id: "principal", label: "PRINCIPAL" },
  { id: "pamc", label: "PAMC" },
  { id: "uobam", label: "UOBAM" },
  { id: "oneam", label: "ONEAM" },
  { id: "eastspring", label: "EASTSPRING" },
  { id: "aberdeen", label: "ABERDEEN" },
  { id: "kkpam", label: "KKPAM" },
  { id: "lhfund", label: "LHFUND" },
  { id: "assetfund", label: "ASSETFUND" },
  { id: "scbam", label: "SCBAM" },
  { id: "mfc", label: "MFC" },
] as const;

/** Figma 38285:289685 — generic "ตัวกรองกองทุน" results list (full catalog, unfiltered). */
export function getFilterResultFunds(pickOnly: boolean, targetCount = 16): MutualFund[] {
  const base = allCatalogFunds();
  return cycleToCount(pickOnly ? base.filter((f) => f.isPick) : base, targetCount);
}

/** Figma 40544:772211 — "ตกลง" with no chips selected shows the full, uncapped catalog. */
export function getAllMutualFunds(pickOnly = false): MutualFund[] {
  const base = allCatalogFunds();
  return pickOnly ? base.filter((f) => f.isPick) : base;
}

/** Stable (non-random) hash so mock per-fund attributes stay consistent across renders. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const FUND_CATEGORY_MAP: Map<string, MutualFundCategoryId[]> = (() => {
  const map = new Map<string, MutualFundCategoryId[]>();
  for (const [categoryId, funds] of Object.entries(MUTUAL_FUND_CATALOG.topPerformers)) {
    for (const fund of funds ?? []) {
      const list = map.get(fund.id) ?? [];
      list.push(categoryId as MutualFundCategoryId);
      map.set(fund.id, list);
    }
  }
  return map;
})();

/** A fund's category ids (as used by the filter's "หมวดหมู่" chips); "others" if uncategorized. */
export function getFundCategoryIds(fundId: string): string[] {
  const categories = FUND_CATEGORY_MAP.get(fundId);
  return categories && categories.length > 0 ? categories : ["others"];
}

/**
 * No fund data models tax-saving type, dividend policy, investment policy, or
 * management company per-fund — these are mock catalog options only. Derive a
 * stable pseudo-assignment per fund (not random per render) so the filter's
 * "no matches" empty state is reachable and repeatable.
 */
export function getFundTaxSavingType(fundId: string): TaxSavingFundType | null {
  const hash = hashString(`tax-${fundId}`);
  if (hash % 4 !== 0) return null;
  return TAX_SAVING_FUND_TYPES[hash % TAX_SAVING_FUND_TYPES.length];
}

export function getFundDividendPolicy(fundId: string): (typeof DIVIDEND_POLICY_OPTIONS)[number] {
  return DIVIDEND_POLICY_OPTIONS[hashString(`div-${fundId}`) % DIVIDEND_POLICY_OPTIONS.length];
}

export function getFundInvestmentPolicy(fundId: string): (typeof INVESTMENT_POLICY_OPTIONS)[number] {
  return INVESTMENT_POLICY_OPTIONS[hashString(`inv-${fundId}`) % INVESTMENT_POLICY_OPTIONS.length];
}

export function getFundManagementCompanyId(fundId: string): string {
  const options = FUND_MANAGEMENT_COMPANIES;
  return options[hashString(`amc-${fundId}`) % options.length].id;
}

/** Figma 38372:395507 — tax-planning recommended funds; same mock pool for every fund type. */
export function getTaxSavingFunds(pickOnly: boolean, targetCount = 16): MutualFund[] {
  return getFilterResultFunds(pickOnly, targetCount);
}

/** Figma 38372:395507 — "ลงทุนได้สูงสุด" is 30% of entered annual income for every fund type. */
export function taxSavingMaxInvestment(annualIncomeThb: number): number {
  if (!Number.isFinite(annualIncomeThb) || annualIncomeThb <= 0) return 0;
  return Math.round(annualIncomeThb * 0.3);
}

function allCatalogFunds(): MutualFund[] {
  const byId = new Map<string, MutualFund>();
  for (const funds of Object.values(MUTUAL_FUND_CATALOG.topPerformers)) {
    for (const fund of funds ?? []) {
      byId.set(fund.id, fund);
    }
  }
  for (const theme of MUTUAL_FUND_CATALOG.themes) {
    for (const fund of theme.funds) {
      byId.set(fund.id, fund);
    }
  }
  return [...byId.values()];
}

function defaultDetailFields(fund: MutualFund): MutualFundDetailFields {
  return {
    nav: fund.price,
    navDate: "ราคาหน่วยลงทุน (NAV) ณ วันล่าสุด",
    changePct: fund.changePct,
    fxRisk: "ความเสี่ยง FX: -",
    acceptsCreditCard: false,
    investmentPolicy:
      "กองทุนนี้มุ่งเน้นการลงทุนตามนโยบายที่ระบุในหนังสือชี้ชวน โดยคำนึงถึงความเสี่ยงและผลตอบแทนที่เหมาะสมกับวัตถุประสงค์การลงทุนของกองทุน",
    fees: {
      frontEnd: "0.00%",
      backEnd: "1.00%",
      management: "0.75%",
    },
    historicalReturns: [
      { period: "1W", value: fund.changePct },
      { period: "1M", value: fund.changePct },
      { period: "3M", value: fund.changePct },
      { period: "6M", value: fund.changePct },
      { period: "YTD", value: fund.changePct },
      { period: "1Y", value: fund.changePct },
    ],
    performanceReturns: [
      { period: "1W", return: fund.changePct, volatility: "-", maxDrawdown: "-" },
      { period: "1M", return: fund.changePct, volatility: "-", maxDrawdown: "-" },
      { period: "3M", return: fund.changePct, volatility: "-", maxDrawdown: "-" },
      { period: "6M", return: fund.changePct, volatility: "-", maxDrawdown: "-" },
      { period: "YTD", return: fund.changePct, volatility: "-", maxDrawdown: "-" },
      { period: "1Y", return: fund.changePct, volatility: "-", maxDrawdown: "-" },
      { period: "3Y", return: "-", volatility: "-", maxDrawdown: "-" },
      { period: "5Y", return: "-", volatility: "-", maxDrawdown: "-" },
      { period: "SI", return: "-", volatility: "-", maxDrawdown: "-" },
    ],
    dividendHistory: [],
    topHoldings: [],
    assetAllocation: [],
    tradingInfo: {
      minInitialPurchase: "-",
      minSubsequentPurchase: "-",
      minRedemption: "-",
      purchaseCutoff: "-",
      redemptionCutoff: "-",
      settlementDays: "-",
    },
    feeDetails: [
      { label: "ค่าธรรมเนียมการซื้อ", actual: "0%", maximum: "2%" },
      { label: "ค่าธรรมเนียมการขาย", actual: "0%", maximum: "1%" },
      { label: "ค่าธรรมเนียมการสับเปลี่ยนเข้า", actual: "0%", maximum: "2%" },
      { label: "ค่าธรรมเนียมการสับเปลี่ยนออก", actual: "0%", maximum: "1%" },
      { label: "ค่าธรรมเนียมการจัดการ", actual: "0.75%", maximum: "2.14%" },
      { label: "ค่าใช้จ่ายรวมทั้งหมด", actual: "-", maximum: "-" },
    ],
    fundInfo: {
      prospectusUrl: "#",
      managementCompany: "-",
      fundType: "-",
      taxBenefit: "-",
      foreignInvestment: "-",
      fxRiskPolicy: "-",
      riskScore: fund.risk,
      dividendPolicy: "ไม่จ่าย",
      currencyPolicy: "-",
      managementFee: "0.75% ต่อปี",
      minimumInvestment: "-",
      registrationDate: "-",
      netAssetValue: "-",
    },
  };
}

/** One mutual fund by id, merged with detail fields when available. */
export function getMutualFund(id: string): MutualFundDetail | undefined {
  const fund = allCatalogFunds().find((f) => f.id === id);
  if (!fund) return undefined;

  const detail = MUTUAL_FUND_CATALOG.fundDetails[id] ?? defaultDetailFields(fund);
  return { ...fund, ...detail };
}

export function getMutualFundSymbol(id: string): string | undefined {
  return allCatalogFunds().find((f) => f.id === id)?.symbol;
}

/* ── NAV history ───────────────────────────────────────────────────────────── */

/** One priced day: `[ISO date, NAV]`, oldest first. */
export type NavPoint = { date: string; nav: number };

export type NavHistory = {
  currency: string;
  points: NavPoint[];
};

/**
 * Five years of NAV, weekly until a year back and every business day after —
 * a 5Y line reads the same at weekly resolution and the file stays small.
 *
 * The series is built to agree with `historicalReturns`: the NAV one month
 * back really is 2.82% below the latest one, and so on down the list, so the
 * chart and the returns under it can never tell different stories.
 */
const NAV_HISTORY: Record<
  string,
  { currency: string; points: (string | number)[][] } | undefined
> = navHistoryRaw;

export function getNavHistory(fundId: string): NavHistory | undefined {
  const raw = NAV_HISTORY[fundId];
  if (!raw) return undefined;
  return {
    currency: raw.currency,
    points: raw.points.map(([date, nav]) => ({ date: String(date), nav: Number(nav) })),
  };
}
