"use client";

import { useToasts } from "@/hooks/use-toasts";
import { riskCtaFor } from "./risk-config";
import type { RiskAlertRow } from "./risk-feed";

/**
 * What the CTA on a risk finding does — mocked, and in one place.
 *
 * **This is a stand-in.** Nothing is sent: "ติดต่อลูกค้า" does not open a
 * dialler and "ส่งต่อฝ่ายกำกับ" does not file anything. Both confirm with a
 * toast and stop there, which is the honest shape for this app — the data
 * layer is local fixtures (`risk-mock-data`) and there is no case to file
 * against. When a backend exists, this hook is the one file that changes: both
 * surfaces already call `act(row)` and neither knows what it does.
 *
 * A hook rather than a component, because the Command Center card and
 * `/command-center/risk-alerts` each render their own rows *and* their own
 * `RiskAlertDetail`, and all four places have to agree about what the button
 * does. A `<RiskCtaButton>` owning its own toast would put a `Toaster` inside
 * every row of the list.
 *
 * Acknowledgement is deliberately not in here. That is a real state change
 * this app does persist (`RISK_ACK_IDS_PREF`), it already has its own path
 * through `useRiskAlertRows`, and folding a pretend action in beside a real
 * one is how a demo starts lying about which is which.
 */
export function useRiskCta() {
  const { toasts, addToast, removeToast } = useToasts();

  /** Fires the finding's one action. Takes the row, not the alert, so the
   *  confirmation can name the client the way the list does — masked when
   *  privacy mode is on. */
  const act = (row: RiskAlertRow) => {
    const cta = riskCtaFor(row.alert);
    addToast({
      status: "success",
      multiline: true,
      message:
        cta.kind === "contact"
          ? `บันทึกการติดต่อ ${row.displayName} แล้ว`
          : `ส่งเรื่อง ${row.alert.ruleCode} — ${row.displayName} ให้ฝ่ายกำกับแล้ว`,
    });
  };

  return { act, toasts, removeToast };
}
