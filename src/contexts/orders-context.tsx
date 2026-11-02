"use client";

/**
 * The one order store for the whole app — bookings, the requests sent to
 * clients, and the orders sent downstream.
 *
 * Mounted once in the dashboard layout, for the same reason `NotesProvider` is:
 * a booking placed from a product page has to show up on `/orders` and in the
 * header bell without either of them remounting. The layout does not remount
 * between pages, so state held here survives navigation where `useState` in a
 * page would not.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Held in React state, seeded from `lib/order-mock-data`. Two things here stand
 * in for systems that do not exist yet, and both are marked:
 *
 * 1. **{@link REQUIREMENT_TURNAROUND_MS}** — a client finishing their forms in
 *    another system. Really a webhook, or a poll of that system.
 * 2. **{@link SUBMISSION_TURNAROUND_MS}** — the back office accepting an order.
 *    Really a status on the order record, arriving the same way.
 * 3. **{@link BACKOFFICE_PICKUP_MS}** — the back office collecting a basket
 *    book that has filled up. Really a job on their side reading full books,
 *    or a webhook this app receives; either way nobody here presses anything.
 *
 * Every mutator is `async` and every call site awaits it, so pointing them at
 * real endpoints is a change in this file alone. `isLoading` is in the contract
 * and permanently `false` for the same reason `useStatic` returns one — the
 * screens already render skeletons against it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BACKOFFICE_ACTOR,
  ORDER_ACTOR,
  seedBookings,
  seedRequirementRequests,
  seedSubmissions,
} from "@/lib/order-mock-data";
import {
  bookingModeForId,
  findBookableProduct,
} from "@/app/(dashboard)/orders/bookable-products";
import { orderTargetFor } from "@/app/(dashboard)/orders/order-book";
import type {
  Booking,
  OrderSubmission,
  RequirementItem,
  RequirementKey,
  RequirementRequest,
} from "@/types/domain";

/**
 * How long a client takes to go and fill their forms in, in the mock.
 *
 * Long enough that the IC sees the "รอลูกค้าดำเนินการ" state and can navigate
 * away from it, short enough that a demo does not stall on it. The moment a
 * real system reports back, delete this and the timer it feeds.
 */
const REQUIREMENT_TURNAROUND_MS = 15_000;

/** The same stand-in, for the back office accepting a submitted order. */
const SUBMISSION_TURNAROUND_MS = 12_000;

/**
 * How long the back office takes to come and collect a full basket book.
 *
 * The basket desks no longer have the IC send anything: a book that reaches its
 * notional is picked up downstream on its own. This is the gap between "ครบยอด"
 * and the order existing — long enough that the IC sees the book sitting full
 * and waiting, which is the state they are now being asked to understand.
 *
 * The quota desks are untouched and still send booking by booking, because
 * there is no basket to fill and nothing for anyone to notice is complete.
 */
const BACKOFFICE_PICKUP_MS = 10_000;

type BookingDraft = {
  productId: string;
  clientId: string;
  clientName: string;
  amount: number;
  /** The checks the booking passed — stored on it, see `Booking.checks`. */
  checks: RequirementItem[];
};

type OrdersContextValue = {
  bookings: Booking[];
  submissions: OrderSubmission[];
  requirementRequests: RequirementRequest[];
  /** Always `false` today — see the module note. */
  isLoading: boolean;
  bookOrder: (draft: BookingDraft) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  /** Nudges a client to complete `keys` in whichever system owns them. */
  sendRequirementRequest: (input: {
    clientId: string;
    clientName: string;
    productId: string;
    keys: RequirementKey[];
  }) => Promise<RequirementRequest>;
  /**
   * Sends every unsent booking on a product as one order.
   *
   * **Quota desks only.** A basket book is collected by the back office when it
   * fills — see {@link BACKOFFICE_PICKUP_MS} — so nothing on those desks calls
   * this, and no screen on them offers a way to.
   */
  submitOrder: (productId: string, bookingIds: string[]) => Promise<OrderSubmission>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

/**
 * Ids minted in the browser. Sequential rather than random so a page that
 * renders one is stable across a re-render, and prefixed so a locally created
 * row is distinguishable from a seeded one at a glance in the log.
 */
let localSeq = 0;
const localId = (prefix: string) => `${prefix}-local-${++localSeq}`;

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(seedBookings);
  const [submissions, setSubmissions] = useState<OrderSubmission[]>(seedSubmissions);
  const [requirementRequests, setRequirementRequests] =
    useState<RequirementRequest[]>(seedRequirementRequests);

  /**
   * Every pending stand-in timer, cleared on unmount.
   *
   * Without this a navigation away mid-round-trip leaves a `setState` pointed
   * at an unmounted tree — which React tolerates but which would also mean a
   * booking silently completing after the surface that started it is gone.
   */
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending) clearTimeout(t);
    };
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  /**
   * The live lists, for the one timer that fires long after it was set.
   *
   * {@link backOfficePickup} runs ten seconds after a book filled up and has to
   * read what is true *then* — whether a booking was cancelled out from under
   * it, whether an order already exists. Closing over the render's `bookings`
   * would have it deciding against a snapshot that is one navigation out of
   * date.
   */
  const bookingsRef = useRef(bookings);
  const submissionsRef = useRef(submissions);
  useEffect(() => {
    bookingsRef.current = bookings;
    submissionsRef.current = submissions;
  }, [bookings, submissions]);

  const bookOrder = useCallback(async (draft: BookingDraft) => {
    // Basket desks take one order per product: once it has been sent the
    // product is closed, and every surface already hides its จองซื้อ. Held here
    // as well because this is where the endpoint will enforce it. Quota desks
    // send every booking on its own, so a sent order closes nothing; their cap
    // is the quota, which the booking modal holds the amount to.
    if (
      bookingModeForId(draft.productId) === "basket" &&
      submissions.some((s) => s.productId === draft.productId)
    ) {
      throw new Error("This product's order has already been sent; it takes no more bookings.");
    }
    const booking: Booking = {
      id: localId("bk"),
      productId: draft.productId,
      clientId: draft.clientId,
      clientName: draft.clientName,
      amount: draft.amount,
      checks: draft.checks,
      createdAt: new Date().toISOString(),
      createdBy: ORDER_ACTOR,
      status: "booked",
    };
    setBookings((prev) => [...prev, booking]);
    return booking;
  }, [submissions]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    // Marked rather than removed: the log is rebuilt from the bookings
    // themselves, so deleting the row would delete the history of it too.
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)),
    );
  }, []);

  const sendRequirementRequest = useCallback<
    OrdersContextValue["sendRequirementRequest"]
  >(
    async ({ clientId, clientName, productId, keys }) => {
      const request: RequirementRequest = {
        id: localId("rq"),
        clientId,
        clientName,
        productId,
        keys,
        sentAt: new Date().toISOString(),
        sentBy: ORDER_ACTOR,
        status: "sent",
        completedAt: null,
      };
      setRequirementRequests((prev) => [...prev, request]);

      // ── Stand-in for the client's own system reporting back ──────────────
      later(() => {
        setRequirementRequests((prev) =>
          prev.map((r) =>
            r.id === request.id
              ? { ...r, status: "completed", completedAt: new Date().toISOString() }
              : r,
          ),
        );
      }, REQUIREMENT_TURNAROUND_MS);

      return request;
    },
    [later],
  );

  /**
   * One order record, however it came to exist.
   *
   * `by` is the whole of the difference between the two desks: an IC pressing
   * ส่งคำสั่งซื้อ on a quota booking, or the back office helping itself to a
   * full basket. It is read back as the actor on the log line, so a basket
   * order must not be attributed to someone who never pressed anything.
   */
  const placeSubmission = useCallback(
    (productId: string, bookingIds: string[], by: string) => {
      const submission: OrderSubmission = {
        id: localId("sub"),
        productId,
        bookingIds,
        submittedAt: new Date().toISOString(),
        submittedBy: by,
        status: "processing",
        // The downstream system assigns this; minting it here is what lets the
        // IC quote a reference while the order is still in flight, which is
        // what the mock is standing in for.
        backendRef: `ORD-${new Date().getFullYear()}-${String(++localSeq).padStart(6, "0")}`,
        settledAt: null,
      };
      setSubmissions((prev) => [...prev, submission]);

      // ── Stand-in for the back office accepting the order ─────────────────
      later(() => {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submission.id
              ? { ...s, status: "completed", settledAt: new Date().toISOString() }
              : s,
          ),
        );
      }, SUBMISSION_TURNAROUND_MS);

      return submission;
    },
    [later],
  );

  const submitOrder = useCallback<OrdersContextValue["submitOrder"]>(
    async (productId, bookingIds) => placeSubmission(productId, bookingIds, ORDER_ACTOR),
    [placeSubmission],
  );

  /**
   * The back office collecting a basket book that has reached its notional.
   *
   * Re-checks on the way in rather than trusting the effect that scheduled it:
   * ten seconds is long enough for a booking to be cancelled out from under a
   * full book, and collecting one that is no longer full would send an order
   * short of its target.
   */
  const backOfficePickup = useCallback(
    (productId: string) => {
      if (submissionsRef.current.some((s) => s.productId === productId)) return;
      const product = findBookableProduct(productId);
      if (!product) return;
      const open = bookingsRef.current.filter(
        (b) => b.productId === productId && b.status === "booked",
      );
      const total = open.reduce((sum, b) => sum + b.amount, 0);
      if (total < orderTargetFor(product)) return;
      placeSubmission(
        productId,
        open.map((b) => b.id),
        BACKOFFICE_ACTOR,
      );
    },
    [placeSubmission],
  );

  /**
   * Watches every basket book for the moment it fills, and hands it over.
   *
   * An effect rather than a line inside `bookOrder`, because a book can reach
   * its target without a booking being placed — a cancellation that lowers the
   * total, a seeded book that is already full when the app loads. Anything that
   * can make a book full has to be able to hand it over, and the only thing all
   * of those have in common is the state landing.
   *
   * `pickedUp` is what keeps it to once each: the effect re-runs on every
   * booking change, and a book stays full for the whole ten seconds it is
   * waiting.
   */
  const pickedUp = useRef(new Set<string>());
  useEffect(() => {
    const totals = new Map<string, number>();
    for (const b of bookings) {
      if (b.status !== "booked") continue;
      if (bookingModeForId(b.productId) !== "basket") continue;
      totals.set(b.productId, (totals.get(b.productId) ?? 0) + b.amount);
    }
    for (const [productId, total] of totals) {
      if (pickedUp.current.has(productId)) continue;
      if (submissions.some((s) => s.productId === productId)) continue;
      const product = findBookableProduct(productId);
      if (!product || total < orderTargetFor(product)) continue;
      pickedUp.current.add(productId);
      later(() => backOfficePickup(productId), BACKOFFICE_PICKUP_MS);
    }
  }, [bookings, submissions, later, backOfficePickup]);

  const value = useMemo(
    () => ({
      bookings,
      submissions,
      requirementRequests,
      isLoading: false,
      bookOrder,
      cancelBooking,
      sendRequirementRequest,
      submitOrder,
    }),
    [
      bookings,
      submissions,
      requirementRequests,
      bookOrder,
      cancelBooking,
      sendRequirementRequest,
      submitOrder,
    ],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within an OrdersProvider");
  return ctx;
}
