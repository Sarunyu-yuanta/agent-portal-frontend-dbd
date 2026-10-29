"use client";

/**
 * The quota desks' tab body — Fixed Income or Global Bond: every bond of that
 * desk this IC has booked into.
 *
 * Same frame as `BasketBooksPanel` (search, step chips, table), with the steps
 * a quota book actually has: open, or sold out. What is waiting on the IC
 * inside an open book is on its row — see `QuotaBooks.tsx`.
 */

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ClipboardTextIcon } from "@phosphor-icons/react";
import { Button, Chip, SearchInput } from "@sarunyu/system-one";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/fade-in";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { QuotaBookTable } from "./QuotaBooks";
import { BOOK_AVAILABILITY_STEPS as STEPS, bookAvailability } from "./order-book";
import { useOrderBooks } from "./use-order-books";
import type { Desk } from "./bookable-products";


export function QuotaBooksPanel({
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

  const step = STEPS.find((s) => s.id === searchParams.get("step")) ?? STEPS[0];

  const matching = useMemo(() => {
    const ofDesk = books.filter((book) => book.desk === desk);
    const query = search.trim().toLowerCase();
    if (!query) return ofDesk;
    return ofDesk.filter((book) =>
      [
        book.productName,
        book.productType,
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
        {/* Same fixed width as `BasketBooksPanel`'s, for the same reason. */}
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

      {isLoading ? (
        <QuotaBookTable books={[]} isLoading />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title={search ? "ไม่พบรายการที่ค้นหา" : step.empty}
          body={
            search
              ? "ลองค้นหาด้วยชื่อสินค้า เลขคำสั่งซื้อ หรือชื่อลูกค้า"
              : "จองซื้อให้ลูกค้าได้จากหน้าสินค้าใน Product Catalog — แต่ละรายการส่งคำสั่งซื้อได้ทันทีจนกว่าจะเต็มโควตา"
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
        <FadeIn key={step.id}>
          <QuotaBookTable books={visible} />
        </FadeIn>
      )}
    </div>
  );
}
