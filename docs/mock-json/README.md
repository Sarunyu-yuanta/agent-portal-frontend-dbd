# Mock Data — JSON Files

Every mock data domain from [`../mock-data-inventory.md`](../mock-data-inventory.md), as plain JSON files, for reference.

17 of these already exist in the codebase (`src/data/*.json`) and are copied here verbatim. The other 16 don't exist as JSON anywhere in the codebase today — they're hardcoded arrays/objects inside `.ts`/`.tsx` files, extracted here into JSON so everything is in one place. Where a file's content is scaled/synthesized/computed at runtime rather than stored as-is, that's called out below.

## Already JSON in the codebase (copied verbatim from `src/data/`)

| File | Doc section | Original location |
|---|---|---|
| `clients.json` | 1.1 | `src/data/clients.json` |
| `nba-actions.json` | 1.2 | `src/data/nba-actions.json` |
| `pipeline-deals.json` | 1.3 | `src/data/pipeline-deals.json` |
| `mini-kanban.json` | 1.4 | `src/data/mini-kanban.json` |
| `insights.json` | 1.5 | `src/data/insights.json` |
| `compliance-alerts.json` | 1.6 | `src/data/compliance-alerts.json` |
| `kyc-data.json` | 1.7 | `src/data/kyc-data.json` |
| `house-view-strategies.json` | 1.8 | `src/data/house-view-strategies.json` |
| `performance.json` | 1.9 | `src/data/performance.json` |
| `client-details.json` | 1.10 | `src/data/client-details.json` |
| `notifications.json` | 1.11 | `src/data/notifications.json` — **likely dead**, the header bell now runs on live Notes/reminders, not this file |
| `investment-solutions.json` | 3.1 | `src/data/investment-solutions.json` |
| `top-ideas.json` | 3.2 | `src/data/top-ideas.json` |
| `structured-products.json` | 3.3 | `src/data/structured-products.json` — real record count is 17; the frontend clones records to fake `meta.allCount: 328`, don't build to that number |
| `global-bonds.json` | 3.4 | `src/data/global-bonds.json` — real record count is ~17; the frontend cycles/repeats records to fake `meta.allOverseasBondsCount: 100`, don't build to that number |
| `fixed-income.json` | 3.5 | `src/data/fixed-income.json` — `companyOrder` lists 8 tickers but only 3 have full `companies` records |
| `market-holidays.json` | 4.1 | `src/data/market-holidays.json` — Thai market closures. `recurring` is applied to any year, `byYear` holds the lunar days announced per year (⚠️ **the 2026/2027 lunar dates are plausible placeholders, not SET's published list**). Substitution days for holidays landing on a weekend are computed at runtime, not stored |

## Newly extracted (no JSON existed for these before)

| File | Doc section | Original location |
|---|---|---|
| `analysts.json` | 1.12 | hardcoded array in `src/lib/mock-data.ts` |
| `call-log.json` | 2.1 | `src/data/call-log-data.ts` — keyed by clientId; a client with no entry falls back to the `"default"` key |
| `client-profiles.json` | 2.2 | `src/data/client-profiles.ts` — the `"default"` key is a fallback for any client not otherwise listed (currently unused — all 8 clients have their own entry) |
| `liabilities-template.json` | 2.3 | `src/data/liabilities-details.ts` — **not per-client data**: one template (categories + percentages + sub-items, scaled off `baseTotal`) that gets rescaled at render time to whatever a client's actual total liabilities figure is |
| `asset-account-details.json` | 2.4 | `src/data/asset-account-details.ts` — `defaultAssetAccounts` is the fallback account list; `assetAccountDetails` is keyed by account number, `assetProductDetails` by asset-class label (both views over largely the same underlying holdings). The app also computes an extra `position` block (avg cost, current price) per holding from `value`/`changeAmount`/`quantity` — omitted here since it's derived, not stored |
| `product-sub-data.json` | 2.5 | `src/data/product-sub-data.ts` — keyed by asset-class label; `"เงินสด"` (cash) intentionally has no sub-products |
| `calendar-market-feed.json` | 4.1 | `src/app/(dashboard)/calendar/mock-market-feed.ts` — **one month's output, not the stored data**. The app generates corporate actions and events into whichever month is being viewed, from fixed days-of-month; this file is what `marketFeed()` returns for September 2026. `kind` and `category` are open-ended strings — `XC` and `quarterly-briefing` in here are deliberately codes the frontend doesn't know, to prove the fallback path |
| `command-center.json` | 4.2 | `src/app/(dashboard)/command-center/command-center-data.ts` — **`clientIntelligenceMap` is keyed `"1"`–`"4"`, not real client ids** (`110001`+); it doesn't correspond to any client automatically today |
| `performance-page-extras.json` | 4.3 | `src/app/(dashboard)/performance/performance-data.ts` |
| `house-view-extras.json` | 4.4 | `src/app/(dashboard)/house-view/house-view-data.ts` — `strategyDetail` is keyed by strategy id (`s1`–`s4`), matching the `id` field in `house-view-strategies.json` |
| `important-forms.json` | 4.5 | `src/app/(dashboard)/client/[id]/client-detail-data.ts` — **the same 6 forms are shown for every client**; this isn't actually per-client data yet despite living in a per-client-page file |
| `pipeline-checklist.json` | 4.6 | `src/app/(dashboard)/pipeline/pipeline-data.ts` — keyed by pipeline stage name |
| `compliance-page-extras.json` | 4.7 | `src/app/(dashboard)/compliance/KpiBar.tsx` + `AlertCards.tsx` — `alertTimestamps` is positionally mapped onto `compliance-alerts.json`'s 4 records (index 0 → first alert, etc.), not its own keyed dataset |
| `ai-insights-page-extras.json` | 4.8 | `src/app/(dashboard)/ai-insights/page.tsx` |
| `research.json` | 4.9 | `src/app/(dashboard)/insights/Research.tsx` — every report links to the same placeholder PDF (`mockReportPdfUrl`); this is a fully standalone dataset, not customer/client data |
| `notes-shape-example.json` | 5 | N/A — Notes has **zero** seeded data; this file is 2 illustrative example records showing the shape (`ApiNote`), not real mock content |
