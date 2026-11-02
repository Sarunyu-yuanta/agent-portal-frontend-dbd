"use client";

/**
 * A desk's orders, one row per **client** — the only layout Order Management
 * lists the four booking tabs in.
 *
 * It used to be one row per product, which is the shape the data is actually
 * stored in: a book belongs to a product, and the notional target, the
 * "ครบยอด" gate and the single submission are all product facts. The IC does
 * not work that way. They have a book of clients and their first question is
 * "what does this client have in flight", which a product-first list could only
 * answer by being read end to end.
 *
 * So the grouping is inverted here rather than in the store: every book still
 * assembles per product (`useOrderBooks`), and this flattens their bookings
 * into one row per client. The three transaction tabs (Stock, TFEX, Mutual
 * Fund) have always been client-first, so this is also what makes all seven
 * tabs read the same way.
 *
 * A row opens that client's own page (`/orders/client/:id`). It used to expand
 * in place to list their products, which the client page then said in full and
 * with each product's status beside it — a preview of a page one click away
 * earns less than the second click target costs.
 *
 * **Only this IC's own clients.** A basket is shared across the desk: the book
 * for one product holds every IC's bookings, and its notional is the whole
 * desk's. That is exactly why Order Management is read by client now — an IC
 * looking at a basket was looking at other people's clients — so the grouping
 * below keeps only what `createdBy` says is theirs.
 *
 * **What a client row cannot say**, and deliberately does not try to: how full
 * a book is. "100,000 / 100,000" is a fact about a deal, not about a person,
 * and a progress bar on a client row would be describing someone else's
 * bookings as much as theirs. It is on the book page, one click in.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
} from "@sarunyu/system-one";
import { CaretRightIcon } from "@phosphor-icons/react";
import { TableRowsSkeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/contexts/privacy-context";
import { getClientProfile } from "@/data/client-profiles";
import { IC_NAME } from "@/lib/current-ic";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type { Booking, OrderBook } from "@/types/domain";
import {
  BOOKING_PHASE_LABEL,
  USD_THB,
  bookingPhase,
  formatLogTime,
  formatOrderAmount,
  type BookingPhase,
} from "./order-book";
import { clientOrdersHref } from "./bookable-products";

const COLUMNS = 5;

/** The tag each phase wears in the status column. */
const PHASE_VARIANT: Record<BookingPhase, "blue" | "green" | "gray"> = {
  review: "blue",
  completed: "green",
  cancelled: "gray",
};

/** Which phases are worth a tag, in the order a client's work moves through. */
const PHASE_ORDER: BookingPhase[] = ["review", "completed", "cancelled"];

/** One product a client is booked into, with their own bookings on it. */
type ClientItem = { book: OrderBook; bookings: Booking[] };

type ClientRow = {
  clientId: string;
  clientName: string;
  items: ClientItem[];
  /**
   * Their notional, per currency.
   *
   * Per currency rather than one converted figure: a desk is one currency in
   * practice, so this is one line nine times out of ten, and the tenth is a
   * client holding THB and USD paper whose combined "total" would be a number
   * that exists nowhere. Sorting converts (see {@link thbValue}); the cell does
   * not.
   */
  totals: Map<string, number>;
  /** How many of their bookings sit in each phase — only non-zero ones render. */
  phases: Map<BookingPhase, number>;
  /** Their newest booking on this desk, which is what the column shows. */
  latestAt: string;
};

/** Amounts compared as money rather than as digits — see `OrderBookTable`. */
function thbValue(totals: Map<string, number>): number {
  let sum = 0;
  for (const [currency, amount] of totals) sum += amount * (currency === "USD" ? USD_THB : 1);
  return sum;
}

/**
 * Every client with a booking on these books, newest activity first.
 *
 * Cancelled bookings are kept rather than filtered: a client whose only booking
 * on this desk was pulled still belongs on the list — dropping them would make
 * the row vanish the moment it has something to explain.
 */
function groupByClient(books: OrderBook[], isPrivate: boolean): ClientRow[] {
  const byClient = new Map<string, ClientRow>();

  for (const book of books) {
    const byClientOnBook = new Map<string, Booking[]>();
    // This IC's bookings only — the rest of the basket is another IC's clients
    // and is not theirs to read. See the module note.
    for (const b of book.allBookings.filter((b) => b.createdBy === IC_NAME)) {
      const list = byClientOnBook.get(b.clientId);
      if (list) list.push(b);
      else byClientOnBook.set(b.clientId, [b]);
    }

    for (const [clientId, bookings] of byClientOnBook) {
      let row = byClient.get(clientId);
      if (!row) {
        row = {
          clientId,
          clientName: maskName(bookings[0].clientName, isPrivate),
          items: [],
          totals: new Map(),
          phases: new Map(),
          latestAt: "",
        };
        byClient.set(clientId, row);
      }
      row.items.push({ book, bookings });
      for (const b of bookings) {
        // A cancelled booking is not money in the deal, so it is counted in the
        // status column and nowhere else.
        if (b.status === "booked") {
          row.totals.set(book.currency, (row.totals.get(book.currency) ?? 0) + b.amount);
        }
        const phase = bookingPhase(b, book);
        row.phases.set(phase, (row.phases.get(phase) ?? 0) + 1);
        if (b.createdAt > row.latestAt) row.latestAt = b.createdAt;
      }
    }
  }

  for (const row of byClient.values()) {
    row.items.sort((a, b) => b.book.productName.localeCompare(a.book.productName));
  }
  return [...byClient.values()].sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}

type SortKey = "client" | "products" | "amount" | "updated";
type SortDir = "none" | "asc" | "desc";

function sortValue(row: ClientRow, key: SortKey): number | string {
  switch (key) {
    case "client":
      return row.clientName.toLowerCase();
    case "products":
      return row.items.length;
    case "amount":
      return thbValue(row.totals);
    case "updated":
      return row.latestAt;
  }
}

export function ClientOrdersTable({
  books,
  tabId,
  isLoading,
}: {
  /** Already filtered to one desk and one availability step by the panel. */
  books: OrderBook[];
  /** Carried into the client page, so its back button returns to this tab. */
  tabId: string;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { isPrivate } = usePrivacy();

  // Local, like the other order tables': the page has no use for the sort, and
  // the default (newest activity first) is what an unsorted list already gives.
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "client",
    dir: "none",
  });
  const dirFor = (key: SortKey): SortDir =>
    sort.key === key && sort.dir !== "none" ? sort.dir : "none";
  const onSort = (key: SortKey) => (next: SortDir) => setSort({ key, dir: next });

  const rows = useMemo(() => {
    const grouped = groupByClient(books, isPrivate);
    if (sort.dir === "none") return grouped;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...grouped].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      return sign * (av < bv ? -1 : av > bv ? 1 : 0);
    });
  }, [books, isPrivate, sort]);

  return (
    <div className="relative overflow-x-auto overflow-y-hidden table-scroll rounded-lg border border-[var(--border-default)]">
      <Table className="table-fixed min-w-[940px]">
        <TableHead>
          <TableRow>
            <TableHeaderCell
              className="w-[28%]"
              sortDirection={dirFor("client")}
              onSortChange={onSort("client")}
            >
              ลูกค้า
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[28%] whitespace-nowrap"
              sortDirection={dirFor("products")}
              onSortChange={onSort("products")}
            >
              สินค้าที่จอง
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[16%] whitespace-nowrap"
              sortDirection={dirFor("amount")}
              onSortChange={onSort("amount")}
            >
              ยอดรวม
            </TableHeaderCell>
            <TableHeaderCell className="w-[16%] whitespace-nowrap">สถานะ</TableHeaderCell>
            <TableHeaderCell
              className="w-[12%] whitespace-nowrap"
              sortDirection={dirFor("updated")}
              onSortChange={onSort("updated")}
            >
              อัปเดตล่าสุด
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRowsSkeleton columns={COLUMNS} />
          ) : (
            rows.map((row) => {
              const profile = getClientProfile(row.clientId);
              return (
                <TableRow
                  key={row.clientId}
                  hoverable
                  tabIndex={0}
                  aria-label={`ดูคำสั่งซื้อของ ${row.clientName}`}
                  className="cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7] active:bg-[var(--bg-default-pressed)]"
                  onClick={() => router.push(clientOrdersHref(row.clientId, tabId))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(clientOrdersHref(row.clientId, tabId));
                    }
                  }}
                >
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar type="text" initials={getInitial(row.clientName)} size="xs" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="type-body-2 truncate !font-semibold text-foreground">
                          {row.clientName}
                        </p>
                        <p className="type-caption truncate text-muted-foreground">
                          {row.clientId} · บัญชี {profile.accountNo}
                        </p>
                      </div>
                      <CaretRightIcon size={14} className="shrink-0 text-muted-foreground" />
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="type-body-2 whitespace-nowrap text-foreground">
                        {row.items.length} รายการ
                      </p>
                      {/* The names, so the count is not the whole of it — this
                          is what tells the IC whether opening the client is
                          worth it. */}
                      <p className="type-caption truncate text-muted-foreground">
                        {row.items.map((i) => i.book.productName).join(", ")}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {row.totals.size === 0 ? (
                        <span className="type-body-2 text-muted-foreground">—</span>
                      ) : (
                        [...row.totals].map(([currency, amount]) => (
                          <span
                            key={currency}
                            className="type-body-2 !font-semibold whitespace-nowrap tabular-nums text-foreground"
                          >
                            {formatOrderAmount(amount, currency)}
                          </span>
                        ))
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex min-w-0 flex-wrap items-start gap-1">
                      {PHASE_ORDER.filter((p) => row.phases.get(p)).map((p) => (
                        <Tag
                          key={p}
                          text={`${BOOKING_PHASE_LABEL[p]} ${row.phases.get(p)}`}
                          variant={PHASE_VARIANT[p]}
                          size="small"
                        />
                      ))}
                    </div>
                  </TableCell>

                  <TableCell>
                    <p className="type-caption whitespace-nowrap tabular-nums text-muted-foreground">
                      {row.latestAt ? formatLogTime(row.latestAt) : "—"}
                    </p>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
