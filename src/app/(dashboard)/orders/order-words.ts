/**
 * What each desk calls the thing an IC creates for a client.
 *
 * The two desks create genuinely different things, and after the quota desks
 * went to one press they stopped sharing a word for it:
 *
 * - **basket** (Thai / Global Structured) — a **การจอง**. It reserves a share of
 *   a notional that has to fill before anything goes downstream, so "จอง" is
 *   exactly right: something is being held.
 * - **quota** (Fixed Income, Global Bond) — a **คำสั่งซื้อ**. There is nothing to
 *   fill, so creating it sends it; nothing is reserved and nothing waits, and
 *   calling it a จอง described a step that does not exist. The desk drops the
 *   word entirely.
 *
 * One table rather than a ternary at each call site: the same four or five
 * strings were being written out per surface, and a new surface could not tell
 * which word it was supposed to use.
 *
 * Keyed by {@link BookingMode}, which every surface already has — from
 * `book.mode`, or from `bookingModeFor(product)` before a book exists.
 */

import type { BookingMode } from "./bookable-products";

export type OrderWords = {
  /** The primary button: what pressing it does. */
  action: string;
  /** The same button mid-flight. */
  actionBusy: string;
  /**
   * The call to action on a product — the button that opens the form, not the
   * one that commits it. Named for opening it, because that is all it does:
   * the bond desks' rows have said `สร้างคำสั่งซื้อ` since before the flow
   * changed (`ACTION_LABELS` in `client/[id]/fixed-income-shared`), and
   * promising a send from a button that only opens a form would be a lie about
   * the next screen.
   */
  cta: string;
  /**
   * The same call to action, without the client.
   *
   * For a button sitting *inside* the orders it would add to — the product
   * page's Order tab — where "ให้ลูกค้า" is already the subject of every row
   * below it. Still names opening the form, not committing it, for the reason
   * {@link OrderWords.cta} gives.
   */
  ctaShort: string;
  /** The record itself, as a noun — "รายละเอียด{record}". */
  record: string;
  /** The label on the row's own timestamp. */
  placedAt: string;
  /** The destructive action on an existing record. */
  cancel: string;
  /** Heading over the four checks a client has to pass. */
  prereq: string;
  /** When the checks were taken, under that heading. */
  asOf: string;
  /** What a book that still takes orders reads as, on a list row. */
  availabilityOpen: string;
  /** How the customer picker counts the ones who can go ahead. */
  eligible: string;
  /** What is left to commit on this product, beside the amount field. */
  remainingLabel: string;
};

export const ORDER_WORDS: Record<BookingMode, OrderWords> = {
  basket: {
    action: "จองซื้อ",
    actionBusy: "กำลังจอง…",
    cta: "จองซื้อให้ลูกค้า",
    ctaShort: "จองซื้อ",
    record: "การจอง",
    placedAt: "จองเมื่อ",
    cancel: "ยกเลิกการจอง",
    prereq: "ข้อมูลที่ต้องมีก่อนจองซื้อ",
    asOf: "ณ วันที่จอง",
    availabilityOpen: "เปิดจอง",
    eligible: "จองได้เลย",
    remainingLabel: "ยังจองได้",
  },
  quota: {
    action: "ส่งคำสั่งซื้อ",
    actionBusy: "กำลังส่ง…",
    cta: "สร้างคำสั่งซื้อ",
    ctaShort: "สร้างคำสั่งซื้อ",
    record: "คำสั่งซื้อ",
    placedAt: "ส่งเมื่อ",
    cancel: "ยกเลิกคำสั่งซื้อ",
    prereq: "ข้อมูลที่ต้องมีก่อนส่งคำสั่งซื้อ",
    asOf: "ณ วันที่ส่งคำสั่งซื้อ",
    availabilityOpen: "เปิดรับคำสั่งซื้อ",
    eligible: "ส่งได้เลย",
    remainingLabel: "โควตาคงเหลือ",
  },
};
