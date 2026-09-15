import type { MutualFundCategoryId } from "./mutual-fund-data";

/** Figma-exported assets for the Mutual Fund catalog tab. */
export const MF_ASSETS = {
  thumbsUp: "/products/mutual-fund/thumbs-up.svg",
  bookOpen: "/products/mutual-fund/book-open-text.svg",
  arrowRightBlue: "/products/mutual-fund/arrow-right-blue.svg",
  sparkline: "/products/mutual-fund/sparkline-positive.svg",
  yuantaPick: "/products/mutual-fund/yuanta-pick-icon.svg",
  filterIllustration: "/products/mutual-fund/filter-illustration.png",
  taxIllustration: "/products/mutual-fund/tax-illustration.png",
  navPriceIcon: "/products/mutual-fund/nav-price-icon.svg",
  coinsIcon: "/products/mutual-fund/coins-icon.svg",
  filePdfIcon: "/products/mutual-fund/file-pdf-icon.svg",
  medal: "/products/mutual-fund/icon-medal.svg",
  insightsSectionBg: "/products/mutual-fund/insights-section-bg.png",
  /** Figma 40135:224291 — mobile insights decorative bg (375×375 @1x) */
  insightsSectionBgMobile: "/products/mutual-fund/insights-section-bg-mobile.png",
  insightCardChart: "/products/mutual-fund/insight-card-chart.svg",
  riskMeter: {
    low: "/products/mutual-fund/risk-meter-2.svg",
    mid: "/products/mutual-fund/risk-meter-4.svg",
    high: "/products/mutual-fund/risk-meter-6.svg",
    veryHigh: "/products/mutual-fund/risk-meter-7.svg",
  },
  /** Figma 39889:665485 — หุ้นทั่วโลก hero (globe). */
  performersHero: {
    "global-equity": "/products/mutual-fund/performers-hero-global-equity.png",
    "thai-equity": "/products/mutual-fund/performers-hero-thai-equity.png",
    "us-equity": "/products/mutual-fund/performers-hero-us-equity.png",
    "japan-equity": "/products/mutual-fund/performers-hero-japan-equity.png",
    "europe-equity": "/products/mutual-fund/performers-hero-europe-equity.png",
    "emerging-equity": "/products/mutual-fund/performers-hero-emerging-equity.png",
    "fixed-income": "/products/mutual-fund/performers-hero-fixed-income.png",
    "global-fixed-income": "/products/mutual-fund/performers-hero-fixed-income.png",
    reits: "/products/mutual-fund/performers-hero-reits.png",
    commodities: "/products/mutual-fund/performers-hero-commodities.png",
    gold: "/products/mutual-fund/performers-hero-gold.png",
  },
  performersPickToggleOff: "/products/mutual-fund/performers-pick-toggle-off.svg",
  performersTagView: "/products/mutual-fund/performers-tag-view.svg",
  performersTagHighlight: "/products/mutual-fund/performers-tag-highlight.svg",
  themeIcon: {
    "head-circuit": "/products/mutual-fund/icon-head-circuit.svg",
    bank: "/products/mutual-fund/icon-bank.svg",
    cpu: "/products/mutual-fund/icon-cpu.svg",
    plant: "/products/mutual-fund/icon-plant.svg",
    health: "/products/mutual-fund/icon-health.svg",
  },
} as const;

/** Figma performers list — one hero illustration per category tab. */
export function mutualFundPerformersHeroSrc(categoryId: MutualFundCategoryId): string {
  return MF_ASSETS.performersHero[categoryId] ?? MF_ASSETS.performersHero["global-equity"];
}

export function mutualFundRiskMeterSrc(risk: number): string {
  if (risk <= 2) return MF_ASSETS.riskMeter.low;
  if (risk <= 4) return MF_ASSETS.riskMeter.mid;
  if (risk <= 5) return MF_ASSETS.riskMeter.mid;
  if (risk <= 6) return MF_ASSETS.riskMeter.high;
  return MF_ASSETS.riskMeter.veryHigh;
}
