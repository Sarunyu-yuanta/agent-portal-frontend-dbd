"use client";

/**
 * Booking a bond from a catalogue page — Fixed Income or Global Bond.
 *
 * The structured desks book from a product page that has its own Order tab to
 * land on. A bond is booked from a list row as often as from its own page, and
 * a list has no tab to switch to, so the hand-off is a toast instead: the
 * booking modal's own "จอง … แล้ว" carries a "ดูรายการจอง" action to the
 * book's page on Order Management, where the order is sent.
 *
 * One hook per page rather than one modal per row: a table of bonds would
 * otherwise mount a modal and a toast stack for every line.
 */

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, Toaster, type ToastStatus } from "@sarunyu/system-one";
import { useToasts } from "@/hooks/use-toasts";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { orderBookHref, type BookableProduct } from "./bookable-products";
import { isBookingOpen } from "./order-book";
import { OrderBookingModal } from "./OrderBookingModal";
import { useOrderBook } from "./use-order-books";

export function useQuotaBooking(): {
  /** Opens the booking modal on this bond. */
  book: (product: BookableProduct) => void;
  /** The modal and its toasts — render once, anywhere on the page. */
  ui: ReactNode;
} {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToasts();
  const [product, setProduct] = useState<BookableProduct | null>(null);
  // Set by `onBooked`, which the modal calls just before its success notice —
  // by then `product` has already been cleared by the close.
  const bookedId = useRef<string | null>(null);

  const notice = (message: string, status: ToastStatus) => {
    const id = status === "success" ? bookedId.current : null;
    bookedId.current = null;
    addToast({
      message,
      status,
      ...(id
        ? { actionLabel: "ดูรายการจอง", onActionClick: () => router.push(orderBookHref(id)) }
        : {}),
    });
  };

  const ui = (
    <>
      {ORDER_BOOKING_ENABLED && product && (
        <OrderBookingModal
          open
          product={product}
          onClose={() => setProduct(null)}
          onNotice={notice}
          onBooked={(booking) => {
            bookedId.current = booking.productId;
          }}
        />
      )}
      <Toaster items={toasts} onRemove={removeToast} />
    </>
  );

  return { book: setProduct, ui };
}

/**
 * The CTA on a bond: opens the booking modal while the bond has quota left,
 * and says เต็มโควตา once it hasn't.
 */
export function QuotaBookButton({
  product,
  onBook,
  size = "xs",
  className,
  label = "จองซื้อให้ลูกค้า",
}: {
  product: BookableProduct;
  onBook: (product: BookableProduct) => void;
  size?: "xs" | "sm" | "lg" | "xl";
  className?: string;
  label?: string;
}) {
  const { data: book } = useOrderBook(product.id);
  const open = !book || isBookingOpen(book);
  return (
    <Button
      variant={open ? "primary" : "disabled"}
      size={size}
      disabled={!open}
      className={`whitespace-nowrap ${className ?? ""}`}
      onClick={(e) => {
        // Rows open the bond's page; the button is a separate action on it.
        e.stopPropagation();
        onBook(product);
      }}
    >
      {open ? label : "เต็มโควตา"}
    </Button>
  );
}
