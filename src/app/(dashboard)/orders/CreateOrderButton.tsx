"use client";

/**
 * "สร้าง Order" on Order Management's bookable tabs — Fixed Income, Thai and
 * Global Structured, Global Bond.
 *
 * Until now an order could only start from a product's own page. From Order
 * Management the IC already knows what they want to place, so this opens a
 * picker of the desk's products and then the same booking modal a product page
 * opens (`OrderBookingModal`, via `useQuotaBooking`, which also owns its
 * toasts). Product first, then client — the modal's own order.
 *
 * Stock, TFEX and Mutual Fund have no button: they are not booked through the
 * portal (see `bookable-products`). On "ทั้งหมด" the button asks for one of the
 * four bookable assets first.
 */

import { useMemo, useState } from "react";
import { Button, SearchInput } from "@sarunyu/system-one";
import { CaretRightIcon, PlusIcon } from "@phosphor-icons/react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import {
  bookableProductsForDesk,
  type BookableProduct,
  type Desk,
} from "./bookable-products";
import { isBookingOpen } from "./order-book";
import { useOrderBooks } from "./use-order-books";
import { useQuotaBooking } from "./useQuotaBooking";

/** The bookable desks, in Order Management's tab order — the asset step. */
const DESKS: { desk: Desk; label: string }[] = [
  { desk: "Fixed Income", label: "Fixed Income" },
  { desk: "Thai Structured", label: "Thai Structured Product" },
  { desk: "Global Structured", label: "Global Structured Product" },
  { desk: "Global Bond", label: "Global Bond" },
];

/**
 * @param desk The desk this tab is — the picker opens on its products. Left
 *   out on "ทั้งหมด", where there is no desk yet: the dialog asks for the asset
 *   first, and the product list gets a back arrow to it.
 * @param clientId Book for this client only — from the client's profile. The
 *   booking modal skips its client list.
 */
export function CreateOrderButton({ desk, clientId }: { desk?: Desk; clientId?: string }) {
  const booking = useQuotaBooking();
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");
  /** The asset chosen in the dialog, when the tab did not fix one. */
  const [chosenDesk, setChosenDesk] = useState<Desk | null>(null);
  const activeDesk = desk ?? chosenDesk;
  const { data: books } = useOrderBooks();
  /**
   * Only what can still be booked. A product that is full, or whose order has
   * gone, is not something to start an order on — it was listed greyed out at
   * first, and the IC had to scroll past the dead ones to find the live.
   *
   * A product with no book yet has had nothing booked on it, so it is open.
   */
  const closed = useMemo(
    () => new Set(books.filter((b) => !isBookingOpen(b)).map((b) => b.productId)),
    [books],
  );
  const openFor = (d: Desk) => bookableProductsForDesk(d).filter((p) => !closed.has(p.id));
  const products = activeDesk ? openFor(activeDesk) : [];

  const query = search.trim().toLowerCase();
  const shown = query
    ? products.filter((p) =>
        [p.underlying, p.productName, p.productType, p.coupon].some((text) =>
          (text ?? "").toLowerCase().includes(query),
        ),
      )
    : products;

  if (!ORDER_BOOKING_ENABLED) return null;

  const close = () => {
    setPicking(false);
    setSearch("");
    setChosenDesk(null);
  };

  const deskLabel = (d: Desk) => DESKS.find((x) => x.desk === d)?.label ?? d;

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        className="shrink-0"
        // Inline, as on the transaction tabs' filter button: the library's
        // fixed height is unlayered and beats a class, and the button has to
        // stand as tall as the search beside it.
        style={{ height: "auto" }}
        leftIcon={<PlusIcon size={16} weight="bold" />}
        onClick={() => setPicking(true)}
      >
        สร้าง Order
      </Button>

      <ResponsiveDialog
        open={picking}
        onOpenChange={(next) => (next ? setPicking(true) : close())}
        title={activeDesk ? `สร้าง Order · ${deskLabel(activeDesk)}` : "สร้าง Order"}
        // Back to the asset step — only where this dialog asked for one.
        onBack={
          !desk && chosenDesk
            ? () => {
                setChosenDesk(null);
                setSearch("");
              }
            : undefined
        }
        closeOnBackdrop
        desktopContentClassName="w-[520px] max-w-full"
      >
        {!activeDesk ? (
          <div className="flex flex-col gap-3 pt-1">
            <p className="pl-1 text-[12.5px] font-semibold text-muted-foreground">เลือกสินทรัพย์</p>
            <div className="flex flex-col gap-2">
              {DESKS.map(({ desk: d, label }) => {
                const count = openFor(d).length;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={count === 0}
                    onClick={() => setChosenDesk(d)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                      count > 0
                        ? "cursor-pointer border-border/60 hover:border-border hover:bg-muted/40"
                        : "cursor-not-allowed border-border/40 opacity-60"
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[13.5px] font-semibold text-foreground">{label}</span>
                      <span className="text-[12px] text-muted-foreground">
                        {count > 0 ? `เปิดรับ ${count} รายการ` : "ไม่มีสินค้าที่เปิดรับ"}
                      </span>
                    </span>
                    <CaretRightIcon size={14} className="shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              placeholder="ค้นหาสินค้า"
              size="sm"
              className="w-full"
            />
            <p className="pl-1 text-[12.5px] font-semibold text-muted-foreground">
              เลือกสินค้า ({shown.length})
            </p>
            <div className="-mx-1 flex max-h-[52vh] flex-col gap-2 overflow-y-auto px-1 py-0.5">
              {shown.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-muted-foreground">
                  {query ? "ไม่พบสินค้าที่ค้นหา" : "ไม่มีสินค้าที่เปิดรับอยู่ตอนนี้"}
                </p>
              ) : (
                shown.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    onPick={() => {
                      // The search and the asset are kept, so going back from
                      // the booking lands on the same list.
                      setPicking(false);
                      booking.book(p, { onBack: () => setPicking(true), clientId });
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </ResponsiveDialog>

      {booking.ui}
    </>
  );
}

/** One product to pick — every row here is still open. */
function ProductRow({ product, onPick }: { product: BookableProduct; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/40"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13.5px] font-semibold text-foreground">
          {product.underlying}
          {product.coupon && (
            <span className="ml-1.5 font-semibold text-primary-action">{product.coupon}</span>
          )}
        </span>
        <span className="truncate text-[12px] text-muted-foreground">
          {[product.productType, product.currency, product.minInvestment && `ขั้นต่ำ ${product.minInvestment}`]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <CaretRightIcon size={14} className="shrink-0 text-muted-foreground" />
    </button>
  );
}
