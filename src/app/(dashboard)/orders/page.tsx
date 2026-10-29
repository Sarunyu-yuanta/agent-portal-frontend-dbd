"use client";

/**
 * Order Management — one tab per asset class, each in the shape that asset is
 * tracked in (see `order-tabs.ts`):
 *
 * - structured products: books filling a basket (`BasketBooksPanel`)
 * - bonds: books drawing down a quota (`QuotaBooksPanel`)
 * - stock, TFEX, mutual funds: clients' own transactions (`TransactionsPanel`)
 */

import { Suspense } from "react";
import { redirect, usePathname, useSearchParams } from "next/navigation";
import { TabGroup } from "@sarunyu/system-one";
import { FadeIn } from "@/components/ui/fade-in";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { catalogListHref } from "@/lib/product-catalog-routes";
import { setQueryState, withQuery } from "@/lib/query-state";
import { BasketBooksPanel } from "./BasketBooksPanel";
import { QuotaBooksPanel } from "./QuotaBooksPanel";
import { TransactionsPanel } from "./TransactionsPanel";
import { DEFAULT_ORDER_TAB, ORDER_TABS, normalizeOrderTab } from "./order-tabs";

export default function OrdersPage() {
  // Gated like `/notes` and `/calendar` are: the route keeps existing and
  // redirects somewhere real, so a bookmarked link doesn't 404 when the flag
  // is off. The page body is a separate component so this guard sits above
  // every hook rather than in front of them.
  if (!ORDER_BOOKING_ENABLED) redirect("/product-catalog");
  return (
    // `useSearchParams` suspends. The tab and every filter live in the URL so a
    // book's "back to Order Management" lands on the tab it came from.
    <Suspense fallback={null}>
      <OrdersPageInner />
    </Suspense>
  );
}

function OrdersPageInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = normalizeOrderTab(searchParams.get("tab"));

  return (
    <div className="flex flex-col gap-4">
      <div className="transparent-tabs scrollable-tabs -mx-4 xl:-mx-6 pl-4 xl:pl-6">
        <TabGroup
          items={ORDER_TABS.map((t) => ({ id: t.id, title: t.title }))}
          activeId={tab.id}
          // `push`: a tab is a destination, and the back button should walk out
          // of it rather than off the page. Every other param belongs to one
          // tab's own filters, so none is carried into the next.
          onChange={(id) =>
            setQueryState(
              withQuery(pathname, "", { tab: id === DEFAULT_ORDER_TAB ? null : id }),
              "push",
            )
          }
          size="md"
        />
      </div>

      <FadeIn key={tab.id}>
        {tab.kind === "basket" ? (
          <BasketBooksPanel desk={tab.desk} catalogHref={catalogListHref(tab.id)} />
        ) : tab.kind === "quota" ? (
          <QuotaBooksPanel desk={tab.desk} catalogHref={catalogListHref(tab.id)} />
        ) : (
          <TransactionsPanel asset={tab.asset} />
        )}
      </FadeIn>
    </div>
  );
}
