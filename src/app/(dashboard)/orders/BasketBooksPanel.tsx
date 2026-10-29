"use client";

/**
 * The basket desks' tab body — Thai Structured or Global Structured: every
 * product of that desk this IC has a book open on.
 *
 * The catalogue is where a deal is found; this is where one that has already
 * been started is tracked. A product with no booking, no submission and no
 * outstanding request is therefore not listed at all (see `useOrderBooks`) — an
 * empty list means there is no work in progress, not that the catalogue is
 * empty.
 */

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ClipboardTextIcon } from "@phosphor-icons/react";
import { Button, Chip, SearchInput } from "@sarunyu/system-one";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { usePrivacy } from "@/contexts/privacy-context";
import { FadeIn } from "@/components/ui/fade-in";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { OrderBookTable } from "./OrderBookTable";
import { BOOK_AVAILABILITY_STEPS as STEPS, bookAvailability } from "./order-book";
import { useOrderBooks } from "./use-order-books";
import type { Desk } from "./bookable-products";

export function BasketBooksPanel({
  desk,
  catalogHref,
}: {
  desk: Desk;
  /** Where the empty state sends the IC to start a booking — the desk's catalogue tab. */
  catalogHref: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: books, isLoading } = useOrderBooks();
  const { isPrivate } = usePrivacy();
  const [search, setSearch] = useState("");

  // A refinement rather than a destination, so `replace` — the back button
  // should leave the page, not step back through every chip clicked on it. In
  // the URL all the same, so a book's "back to Order Management" lands on the
  // step it was opened from.
  const requestedStep = searchParams.get("step");
  const step = STEPS.find((s) => s.id === requestedStep) ?? STEPS[0];

  // "Search All" — anything a product is recognised by: its name and type,
  // the desk, the order reference, and the clients booked into it.
  const matching = useMemo(() => {
    const ofType = books.filter((book) => book.desk === desk);
    const query = search.trim().toLowerCase();
    if (!query) return ofType;
    return ofType.filter((book) =>
      [
        book.productName,
        book.productType,
        book.desk,
        ...book.submissions.map((s) => s.backendRef),
        ...book.allBookings.flatMap((b) => [b.clientId, maskName(b.clientName, isPrivate)]),
      ].some((text) => text.toLowerCase().includes(query)),
    );
  }, [books, desk, search, isPrivate]);

  const visible = useMemo(
    () => (step.id === "all" ? matching : matching.filter((b) => bookAvailability(b) === step.id)),
    [matching, step],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Steps on the left, search on the right; stacked below `lg`. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollable-tabs flex min-w-0 flex-1 items-center gap-2">
          {STEPS.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              type="single"
              selected={s.id === step.id}
              onClick={() =>
                setQueryState(
                  withQuery(pathname, searchParams, { step: s.id === "all" ? null : s.id }),
                  "replace",
                )
              }
            />
          ))}
        </div>
        {/* A fixed width rather than the row's leftovers: a query is a few
            characters, and a bar as wide as the page read as the page's
            main control. Width on the wrapper — the library's own `.w-full`
            outranks a Tailwind width set on the component. */}
        <div className="lg:w-[280px] lg:shrink-0">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            placeholder="Search All"
            className="w-full"
          />
        </div>
      </div>

      {/* Loading sits above the empty check — otherwise, once orders have a real
          endpoint, every visit flashes "ยังไม่มีรายการจอง" before the data
          lands. The project-wide rule, see `docs/handover.md`. */}
      {isLoading ? (
        <OrderBookTable books={[]} isLoading />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title={search ? "ไม่พบรายการที่ค้นหา" : step.empty}
          body={
            search
              ? "ลองค้นหาด้วยชื่อสินค้า เลขคำสั่งซื้อ หรือชื่อลูกค้า"
              : "เริ่มจองให้ลูกค้าได้จากหน้าสินค้าใน Product Catalog — การจองจะมารวมกันที่นี่"
          }
          actionSlot={
            search ? undefined : (
              <Link href={catalogHref}>
                <Button variant="outline" size="md">
                  ไปที่ Product Catalog
                </Button>
              </Link>
            )
          }
        />
      ) : (
        // Keyed on the step, so switching it replays the fade — the rows change
        // completely.
        <FadeIn key={step.id}>
          <OrderBookTable books={visible} />
        </FadeIn>
      )}
    </div>
  );
}
