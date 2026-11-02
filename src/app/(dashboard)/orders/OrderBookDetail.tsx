"use client";

/**
 * One product's book: who has been booked into it, what has been sent
 * downstream, and everything that has happened to it.
 *
 * The page is built around a single rule — **nothing happens until the book is
 * full**. That is why the summary leads with the shortfall rather than the
 * total, and why "จองเพิ่มให้ลูกค้า" is the one action on it: filling the book
 * is the whole of the job. Sending the order is not the IC's to do on a basket
 * desk — the back office collects a full book on its own, so the panel says
 * that rather than offering a button nobody can press.
 *
 * The quota desks keep their own send, one per booking (`onSend` on the table).
 *
 * ## Layout
 *
 * Two columns from `lg`, 80/20: the lists on the left, the summary pinned on
 * the right. The booking list is the same wide table as the product page's
 * Order tab (`ProductOrderSection`), so it gets most of the width; the
 * summary is what every decision is made against, so it stays in view while
 * the list scrolls. Below `lg` the summary comes first.
 */

import { useCallback, useState } from "react";
import {
  ArrowLeftIcon,
  ClockIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import {
  Button,
  LinearProgress,
  Tag,
  Toaster,
  type ToastStatus,
} from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { useOrders } from "@/contexts/orders-context";
import { useSectionBack } from "@/hooks/use-section-back";
import { useToasts } from "@/hooks/use-toasts";
import type { Booking, OrderBook } from "@/types/domain";
import { ordersListHref, type BookableProduct } from "./bookable-products";
import {
  BOOK_AVAILABILITY_LABEL,
  BOOK_AVAILABILITY_VARIANT,
  bookAvailability,
  SUBMISSION_TAG,
  formatLogTime,
  formatOrderAmount,
  headlineRound,
  isBookClosed,
  isBookingOpen,
  quotaOrderCounts,
  quotaUsedPct,
} from "./order-book";
import { OrderBookingModal } from "./OrderBookingModal";
import { ProductLogos } from "./ProductLogos";
import { ProductOrderSection } from "./ProductOrderSection";
import { ProductTermsModal } from "./ProductTermsModal";

export function OrderBookDetail({
  book,
  product,
}: {
  book: OrderBook;
  product: BookableProduct;
}) {
  // With no trail behind it, back lands on the tab this desk is listed under.
  const back = useSectionBack(() => ordersListHref(book.productId));
  const { submitOrder } = useOrders();
  const { toasts, addToast, removeToast } = useToasts();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  // What the confirm sheet would send: a basket book's whole open round, or
  // one booking of a quota book. `null` while the sheet is closed.
  const [confirming, setConfirming] = useState<Booking[] | null>(null);
  const quota = book.mode === "quota";
  const [sending, setSending] = useState(false);
  // The booking just placed here, marked in the table — see `ProductOrderSection`.
  const [newBookingId, setNewBookingId] = useState<string | null>(null);
  const clearNewBooking = useCallback(() => setNewBookingId(null), []);

  const notice = (message: string, status: ToastStatus) => addToast({ message, status });

  // A product is booked once: nothing more after the order is sent, and closed
  // for good once the back office answers — see `isBookingOpen`/`isBookClosed`.
  // Everything else the summary reads — how full, the shortfall, the order —
  // is derived inside `BasketSummary`/`QuotaSummary`, which are the only
  // things that need it.
  const canBook = isBookingOpen(book);

  const send = async () => {
    setSending(true);
    const submission = await submitOrder(
      book.productId,
      (confirming ?? []).map((b) => b.id),
    );
    setSending(false);
    setConfirming(null);
    addToast({
      message: `ส่งคำสั่งซื้อแล้ว (${submission.backendRef}) — จะแจ้งเตือนเมื่อระบบหลังบ้านดำเนินการเสร็จ`,
      status: "success",
    });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {/* The product, as a band across the whole page rather than a card on it.

          Which product this is answers a different question from anything in
          the two columns underneath — those are about *this deal*, and this is
          about the instrument the deal is written on. A rounded card made it
          the first of three panels, which is the wrong rank for it: it is the
          page's own heading, and a heading does not sit in a box beside the
          content it names.

          `-mx-[9999px] px-[9999px]` is the full-bleed trick this app already
          uses for Full Profile's identity bar: the negative margin takes the
          background past the layout's padding *and* its `max-w-[1280px]`
          centering, and the matching padding puts the content back exactly
          where it was. `main` is `overflow-x-clip`, which is what stops the
          9999px from becoming 9999px of scrollable page. `xl:-mt-6` cancels
          the layout's top padding so the band starts under the breadcrumb bar
          instead of floating below a grey stripe — and only above `xl`,
          because below it the layout puts its own breadcrumb between the two
          and pulling up would run the band into it.

          A bottom border, not a shadow: it is a divider between the heading
          and the page, and a shadow would make it hover over content it is
          flush against. */}
      {/* ── One row ──
          Which product, and where its deal stands, side by side. They were two
          rows with a rule between them, which left the title's row three
          quarters empty and the figures a paragraph below the thing they are
          about. `flex-wrap` is what makes one row safe: the identity block
          holds the line and everything else drops under it as the window
          narrows, rather than the whole band squeezing. */}
      <header className="-mx-[9999px] flex flex-wrap items-stretch gap-y-4 border-b border-border bg-card px-[9999px] py-4 xl:-mt-6">
        {/* `flex-1`, so the identity takes the slack and everything after it
            lands against the right edge without an `ml-auto` of its own.

            The `min-w` is doing real work: it is roughly what the back arrow,
            the logos and a two-line title need, so when the figures beside it
            would not fit they wrap to a second line instead of squeezing the
            product's name down to an ellipsis. A header that cannot say which
            product it is about has lost the argument. */}
        <div className="flex min-w-[420px] flex-1 items-center gap-2 pr-6">
        <Button
          variant="plain"
          size="icon-sm"
          // Back to the list *as it was* — step chip and layout. A hardcoded
          // "/orders" dropped an IC who opened a book from a filtered step back
          // onto "All". Same trail the breadcrumb is built from.
          onClick={back}
          aria-label="กลับไป Order Management"
          className="shrink-0"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        {/* Beside the title rather than above it: the header is one line on a
            phone, and the strip is how the deal is recognised in the catalogue
            and on the list this page was opened from. */}
        <ProductLogos logos={book.logos} className="hidden sm:flex" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* The tag rides the title line. It is a fact about *this product* —
              whether it still takes bookings — and at the far end of the header
              it read as the last of the deal's figures. Beside the name it is
              read in the same glance as the thing it qualifies, and a wrap can
              no longer strand it on a line of its own. */}
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="type-h6 min-w-0 truncate font-bold text-foreground">
              {book.productName}
            </h1>
            <Tag
              text={BOOK_AVAILABILITY_LABEL[bookAvailability(book)]}
              variant={BOOK_AVAILABILITY_VARIANT[bookAvailability(book)]}
              size="large"
            />
          </div>
          {/* Which desk, and a way back to the product the deal is written on —
              a book is a view of someone else's instrument, and the terms
              (coupon, KO, KI) live on the catalogue page, not here. */}
          <p className="type-caption truncate text-muted-foreground">
            {book.desk} · {book.productType} ·{" "}
            {/* A modal, not a link away: the terms are a glance, and leaving
                would lose the book the IC is working on. */}
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="cursor-pointer text-[#0a6ee7] transition-colors hover:underline"
            >
              ดูรายละเอียดสินค้า
            </button>
          </p>
        </div>
        </div>

        {/* Where the deal stands — in the header rather than a column beside
            the table, because these figures are read once on arrival and then
            left alone. As a narrow sticky panel they took a fifth of the page
            for the whole visit; here they are one glance and the table gets
            the width its ten columns were always short of. */}
        {quota ? (
          <QuotaSummary book={book} canBook={canBook} onBook={() => setBookingOpen(true)} />
        ) : (
          <BasketSummary book={book} onBook={() => setBookingOpen(true)} />
        )}
      </header>

      {/* ── Bookings ──
          The whole width now that the summary has moved into the header band:
          the table is ten columns of statuses, and the 80/20 split it used to
          live in was spending a fifth of the page on figures that read better
          as a strip. One list, no tabs — a product is booked once and
          collected as one order, so the order is a few figures above rather
          than a list of its own. The same table as the product page's Order
          tab: one booking list, one set of columns, wherever it is read. */}
      <div className="flex min-w-0 flex-col gap-3">
        <ProductOrderSection
          variant="book"
          product={product}
          onBook={() => setBookingOpen(true)}
          onNotice={notice}
          newBookingId={newBookingId}
          onNewBookingSeen={clearNewBooking}
          onSend={quota ? (b) => setConfirming([b]) : undefined}
        />
      </div>

      <ProductTermsModal product={product} open={termsOpen} onClose={() => setTermsOpen(false)} />

      <OrderBookingModal
        open={bookingOpen}
        product={product}
        onClose={() => setBookingOpen(false)}
        onNotice={notice}
        // The new row is marked in the table, the same as the product page does.
        onBooked={(booking) => setNewBookingId(booking.id)}
      />

      <ResponsiveBottomSheetModal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title="ยืนยันส่งคำสั่งซื้อ"
        titleId="order-submit-title"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-3">
          {/* Quota desks only now — a basket book is collected rather than
              sent, so this sheet is never opened on one. The branch is gone
              with it: one sentence, about the one thing that still reaches
              here. */}
          <p className="type-body-2 leading-5 text-muted-foreground">
            {`ส่งการจองนี้ของ ${book.productName} เข้าระบบหลังบ้านเป็นคำสั่งซื้อ หลังส่งแล้วจะแก้ไขรายการนี้ไม่ได้`}
          </p>
          {/* Grey panel, divided inside — the same frame as the booking form's
              customer list, so a list of people reads the same everywhere. */}
          <ul className="flex max-h-[40dvh] min-h-0 flex-col divide-y divide-border overflow-y-auto rounded-xl bg-[#f3f4f6]">
            {(confirming ?? []).map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <span className="type-body-2 min-w-0 flex-1 truncate text-foreground">
                  {b.clientName}
                </span>
                <span className="type-body-2 !font-semibold shrink-0 text-foreground">
                  {formatOrderAmount(b.amount, book.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between gap-2">
            <span className="type-body-2 text-muted-foreground">รวมทั้งสิ้น</span>
            <span className="type-subtitle-2 font-bold text-foreground">
              {formatOrderAmount(
                (confirming ?? []).reduce((sum, b) => sum + b.amount, 0),
                book.currency,
              )}
            </span>
          </div>
          <Button
            variant={sending ? "disabled" : "primary"}
            size="lg"
            disabled={sending}
            onClick={send}
            className="w-full"
          >
            {sending ? "กำลังส่ง…" : "ยืนยันส่งคำสั่งซื้อ"}
          </Button>
        </div>
      </ResponsiveBottomSheetModal>

      <Toaster items={toasts} onRemove={removeToast} />
    </div>
  );
}


/**
 * A quota book's summary: how much of the issue is gone, what is left, and
 * where its orders are. No "send" here — each booking is sent from its own
 * row in the list beside it.
 */
/**
 * One figure in the summary strip — caption over value.
 *
 * Stacked, where the old panel put label left and value right: in a row of
 * several, a reader scanning values wants them on one baseline, and
 * label-left pairs make them zigzag.
 */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-center gap-0.5 self-stretch border-l border-border px-6">
      <dt className="type-caption whitespace-nowrap text-muted-foreground">{label}</dt>
      <dd className="type-body-2 !font-semibold whitespace-nowrap tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

/**
 * How full the book is, as the strip's left-hand block.
 *
 * Capped rather than left to `flex-1` alone: a progress bar the width of a
 * desktop page reads as a loading indicator, and the numbers under it are the
 * part being read anyway.
 */
function FillBlock({
  caption,
  amount,
  used,
  target,
  currency,
  pct,
  full,
}: {
  caption: string;
  amount: string;
  used: number;
  target: number;
  currency: string;
  pct: number;
  full: boolean;
}) {
  return (
    <div className="flex w-full min-w-[200px] max-w-[260px] shrink flex-col gap-1.5 self-stretch justify-center border-l border-border px-6">
      <span className="type-caption text-muted-foreground">{caption}</span>
      <p className="type-h5 font-bold tabular-nums text-foreground">{amount}</p>
      {/* The bar's own numbers sit on it — booked over target, and the
          percentage — so it can be read without the headline above. */}
      <LinearProgress value={pct} />
      <div className="type-caption flex items-baseline justify-between gap-2 tabular-nums text-muted-foreground">
        <span>
          {/* Primary once the target is met — the same rule the product page's
              "Request / Notional Size" follows. */}
          <span className={`font-semibold ${full ? "text-[#0a6ee7]" : "text-foreground"}`}>
            {used.toLocaleString("en-US")}
          </span>{" "}
          / {target.toLocaleString("en-US")} {currency}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

/** The strip's coloured one-liner — what the IC is waiting on, if anything. */
function Notice({
  tone,
  icon,
  children,
}: {
  tone: "yellow" | "green";
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const fill =
    tone === "yellow"
      ? "bg-[var(--fill-yellow-100)] text-[var(--fill-yellow-700)]"
      : "bg-[var(--fill-green-100)] text-[var(--fill-green-700)]";
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${fill}`}>
      {icon}
      <span className="type-body-2 whitespace-nowrap">{children}</span>
    </div>
  );
}

/**
 * A basket deal in one strip: how full, what is missing, and the one action.
 *
 * Everything the old right-hand panel carried, laid out across instead of
 * down. The order of the row is the order of the questions — how far along,
 * then the facts, then what is in the way, then the button — and the action
 * is pushed to the far right with `ml-auto` so it lands in the same place
 * whether or not there is a notice beside it.
 */
function BasketSummary({ book, onBook }: { book: OrderBook; onBook: () => void }) {
  const round = headlineRound(book);
  const canBook = isBookingOpen(book);
  const closed = isBookClosed(book);
  const order = book.submissions[0];

  return (
    <>
      <FillBlock
        // "ยังไม่มีคำสั่งซื้อ", not "ยังไม่ส่ง": nobody on this desk sends one,
        // so a caption phrased as an outstanding task would be describing a job
        // the IC does not have.
        caption={round.previousRef ? `รับไปแล้ว (${round.previousRef})` : "ยังไม่มีคำสั่งซื้อ"}
        amount={formatOrderAmount(round.amount, book.currency)}
        used={round.amount}
        target={book.targetAmount}
        currency={book.currency}
        pct={round.pct}
        full={round.amount >= book.targetAmount}
      />

      <dl className="flex flex-wrap items-stretch gap-y-4">
        {/* The count only — who they are is the booking list on this very page,
            so a figure repeating it earned nothing. Counted by client: one
            client can book the same product twice. */}
        <Stat
          label="ลูกค้าที่จอง"
          value={`${new Set(round.bookings.map((b) => b.clientId)).size} ราย`}
        />
        <Stat label="ขั้นต่ำต่อราย" value={formatOrderAmount(book.minTicket, book.currency)} />
        {/* The one order, once there is one — what the "คำสั่งซื้อ" tab used to
            list, and now four more figures in the same row rather than a second
            panel under the first. */}
        {order && (
          <>
            <Stat label="เลขที่คำสั่งซื้อ" value={order.backendRef} />
            {/* "รับไปเมื่อ" on this desk — the order was collected, and a label
                reading "ส่งเมื่อ" would be crediting the send to a person who
                never made one. */}
            <Stat label="รับไปเมื่อ" value={formatLogTime(order.submittedAt)} />
            <Stat
              label="ตอบกลับเมื่อ"
              value={order.settledAt ? formatLogTime(order.settledAt) : "รอผลจากระบบหลังบ้าน"}
            />
          </>
        )}
      </dl>

      <div className="flex flex-wrap items-center justify-end gap-3 self-stretch border-l border-border pl-6">
        {/* No shortfall chip. The bar beside it already reads
            "30,000 / 100,000 USD" and "30%", and a third statement of the same
            gap — in a colour loud enough to look like a warning — was the
            busiest thing in a row that is otherwise all plain figures. */}
        {/* "รอระบบหลังบ้านมารับ", not "พร้อมส่งคำสั่งซื้อ": there is no longer
            anything for the IC to press, so a green tick promising readiness
            would be pointing at a button that is not there. Yellow rather than
            green for the same reason — the deal is complete but the order does
            not exist yet. */}
        {book.status === "ready" && (
          <Notice
            tone="yellow"
            icon={
              <ClockIcon size={18} weight="fill" className="shrink-0 text-[var(--fill-yellow-600)]" />
            }
          >
            ครบยอดแล้ว — รอระบบหลังบ้านมารับคำสั่งซื้อ
          </Notice>
        )}
        {order && (
          <Tag
            text={SUBMISSION_TAG[order.status].text}
            variant={SUBMISSION_TAG[order.status].variant}
            size="large"
          />
        )}
        {/* One button, because there is only one thing the IC can do to a
            basket book: book more clients into it. Sending the order was the
            other half of this pair and belongs to the back office now — a
            disabled "ส่งคำสั่งซื้อ" left in its place would be offering an
            action that never becomes available to them. */}
        {canBook && (
          <Button
            variant="primary"
            size="md"
            onClick={onBook}
            leftIcon={<PlusIcon size={18} />}
            className="shrink-0"
          >
            จองเพิ่มให้ลูกค้า
          </Button>
        )}
      </div>

      {/* `order-last` so it is the band's closing line whatever else wrapped
          above it — a sentence about the whole header rather than another item
          in the row of figures. */}
      {closed && (
        <p className="type-caption order-last w-full text-muted-foreground">
          ระบบหลังบ้านรับคำสั่งซื้อไปแล้ว — สินค้านี้ปิดรับจองและนำออกจาก Product Catalog แล้ว
        </p>
      )}
    </>
  );
}

/** The same strip for a quota book, which fills by quota rather than by basket. */
function QuotaSummary({
  book,
  canBook,
  onBook,
}: {
  book: OrderBook;
  canBook: boolean;
  onBook: () => void;
}) {
  const pct = quotaUsedPct(book);
  const counts = quotaOrderCounts(book);
  return (
    <>
      <FillBlock
        caption="ใช้โควตาแล้ว"
        amount={formatOrderAmount(book.quotaUsed, book.currency)}
        used={book.quotaUsed}
        target={book.targetAmount}
        currency={book.currency}
        pct={pct}
        full={false}
      />

      <dl className="flex flex-wrap items-stretch gap-y-4">
        <Stat
          label="ลูกค้าที่จอง"
          value={`${new Set(book.bookings.map((b) => b.clientId)).size} ราย`}
        />
        <Stat label="ขั้นต่ำต่อราย" value={formatOrderAmount(book.minTicket, book.currency)} />
        <Stat label="รอผลหลังบ้าน" value={`${counts.processing} รายการ`} />
        <Stat label="สำเร็จ" value={`${counts.completed} รายการ`} />
      </dl>

      <div className="flex flex-wrap items-center justify-end gap-3 self-stretch border-l border-border pl-6">
        {canBook && (
          <Notice tone="green">
            โควตาคงเหลือ{" "}
            <span className="!font-bold tabular-nums">
              {formatOrderAmount(book.quotaRemaining, book.currency)}
            </span>
          </Notice>
        )}
        {counts.toSend > 0 && (
          <Notice
            tone="green"
            icon={
              <PaperPlaneTiltIcon
                size={18}
                weight="fill"
                className="shrink-0 text-[var(--fill-green-600)]"
              />
            }
          >
            รอส่งคำสั่งซื้อ {counts.toSend} รายการ — กดที่รายการได้เลย
          </Notice>
        )}
        {canBook && (
          <Button
            variant="primary"
            size="md"
            onClick={onBook}
            leftIcon={<PlusIcon size={18} />}
            className="shrink-0"
          >
            จองเพิ่มให้ลูกค้า
          </Button>
        )}
      </div>

      {/* Same `order-last` as the basket's closing line — see there. */}
      {!canBook && (
        <p className="type-caption order-last w-full text-muted-foreground">
          ใช้โควตาครบแล้ว — สินค้านี้ปิดรับจองและนำออกจาก Product Catalog แล้ว
        </p>
      )}
    </>
  );
}

// ── Panels ───────────────────────────────────────────────────────────────────
