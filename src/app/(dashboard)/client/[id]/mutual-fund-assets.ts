/** Figma-exported assets for the Mutual Fund catalog tab. */
export const MF_ASSETS = {
  thumbsUp: "/products/mutual-fund/thumbs-up.svg",
  bookOpen: "/products/mutual-fund/book-open-text.svg",
  arrowRightBlue: "/products/mutual-fund/arrow-right-blue.svg",
  sparkline: "/products/mutual-fund/sparkline-positive.svg",
  yuantaPick: "/products/mutual-fund/yuanta-pick-icon.svg",
  filterIllustration: "/products/mutual-fund/filter-illustration.png",
  taxIllustration: "/products/mutual-fund/tax-illustration.png",
  detailChartLine: "/products/mutual-fund/detail-chart-line.svg",
  detailChartArea: "/products/mutual-fund/detail-chart-area.svg",
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
  themeIcon: {
    "head-circuit": "/products/mutual-fund/icon-head-circuit.svg",
    bank: "/products/mutual-fund/icon-bank.svg",
    cpu: "/products/mutual-fund/icon-cpu.svg",
    plant: "/products/mutual-fund/icon-plant.svg",
    health: "/products/mutual-fund/icon-health.svg",
  },
} as const;

export function mutualFundRiskMeterSrc(risk: number): string {
  if (risk <= 2) return MF_ASSETS.riskMeter.low;
  if (risk <= 4) return MF_ASSETS.riskMeter.mid;
  if (risk <= 5) return MF_ASSETS.riskMeter.mid;
  if (risk <= 6) return MF_ASSETS.riskMeter.high;
  return MF_ASSETS.riskMeter.veryHigh;
}
