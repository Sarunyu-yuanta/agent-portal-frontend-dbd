/**
 * Order Management's tabs: one per asset class, each showing what that asset
 * has to track.
 *
 * - `basket` — structured products. Bookings fill a basket, then go downstream
 *   as one order (see `bookable-products.ts`).
 * - `quota` — bonds. Each booking goes downstream on its own until the issue
 *   quota is used up.
 * - `transactions` — listed products the client trades themselves. Nothing is
 *   booked; the tab lists the trades clients placed through each platform.
 *
 * Ids and order match the catalogue's own tabs (`PRODUCT_CATEGORIES`), so
 * "Fixed Income" sits in the same place in both.
 */

import type { Desk } from "./bookable-products";
import type { TransactionAsset } from "@/types/domain";

export type OrderTab =
  | { id: string; title: string; kind: "basket"; desk: Desk }
  | { id: string; title: string; kind: "quota"; desk: Desk }
  | { id: string; title: string; kind: "transactions"; asset: TransactionAsset };

export const ORDER_TABS: OrderTab[] = [
  { id: "stock", title: "Stock", kind: "transactions", asset: "stock" },
  { id: "tfex", title: "TFEX", kind: "transactions", asset: "tfex" },
  { id: "mutual-fund", title: "Mutual Fund", kind: "transactions", asset: "mutual-fund" },
  { id: "fixed-income", title: "Fixed Income", kind: "quota", desk: "Fixed Income" },
  { id: "thai-structured", title: "Thai Structured Product", kind: "basket", desk: "Thai Structured" },
  { id: "structured", title: "Global Structured Product", kind: "basket", desk: "Global Structured" },
  { id: "global-bond", title: "Global Bond", kind: "quota", desk: "Global Bond" },
];

/**
 * Where `/orders` lands with no `?tab=`. Global Structured rather than the
 * first tab: it is the desk this page was built for, and every older link into
 * it — the empty state, the header bell — meant that list.
 */
export const DEFAULT_ORDER_TAB = "structured";

export function normalizeOrderTab(value: string | null | undefined): OrderTab {
  return (
    ORDER_TABS.find((t) => t.id === value) ??
    ORDER_TABS.find((t) => t.id === DEFAULT_ORDER_TAB)!
  );
}
