"use client";

/**
 * How this product's offers have gone, in one line under the send button.
 *
 * The report proper belongs on `/performance` and is not built yet. This is the
 * readback that keeps the log from being write-only in the meantime: having
 * just sent a Proposal, the IC can see that it went, and come back later to see
 * whether it turned into a booking.
 *
 * Counts **clients, not sends** — see `proposalTally`. Hidden at zero: a line
 * reading "ส่ง Proposal แล้ว 0 ราย" is a line about nothing.
 */

import { useOrders } from "@/contexts/orders-context";
import { useOrderBook } from "./use-order-books";
import { proposalTally } from "./order-proposals";

export function ProposalTallyLine({ productId }: { productId: string }) {
  const { proposals } = useOrders();
  const { data: book } = useOrderBook(productId);
  if (!book) return null;

  const { clients, won } = proposalTally(proposals, book);
  if (clients === 0) return null;

  return (
    <p className="text-xs leading-4 text-[#6a7282] text-center">
      ส่ง Proposal แล้ว {clients} ราย · จองแล้ว{" "}
      <span className={won > 0 ? "font-semibold text-[var(--fill-green-700)]" : undefined}>
        {won}
      </span>
    </p>
  );
}
