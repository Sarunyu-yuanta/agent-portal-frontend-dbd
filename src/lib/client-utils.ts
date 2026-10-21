import type { AssetHeroSummary } from "@/components/AssetSummarySection";

export const LINE_AVAILABLE_RATIO = 320_000 / 9_400_000;
export const LIABILITIES_MULTIPLIER = 0.0197;

/**
 * Display-only rename for asset-class / product labels. The underlying data
 * label stays "อนุพันธ์" for lookups; only the rendered text becomes "TFEX".
 */
export function displayAssetLabel(label: string): string {
  return label === "อนุพันธ์" ? "TFEX" : label;
}

export type ClientSummaryInput = {
  /** Raw THB. */
  aum: number;
  cashIdlePct: number;
  /** Signed percent, e.g. `12.4` or `-1.5`. */
  plYtdPct: number;
};

/**
 * A client's AUM as the headline figure: 450_000_000 → "฿ 450M",
 * 1_200_000_000 → "฿ 1.2B".
 *
 * Billions get one decimal (trailing ".0" dropped), millions are shown whole —
 * which is the format this app has always displayed.
 *
 * Takes raw THB rather than a pre-formatted string on purpose. This used to be
 * stored formatted in `clients.json`, which meant every total, sort and
 * percentage had to parse it back to a number first (13 call sites), through a
 * parser that assumed millions and so read "฿ 1.2B" as 1.2 *million* — a
 * thousandfold error waiting for the first client above ฿1,000M. Numbers in the
 * data, formatting at the edge, keeps that impossible.
 */
export function formatAumThb(thb: number): string {
  const millions = thb / 1_000_000;
  if (Math.abs(millions) >= 1000) {
    return `฿ ${(millions / 1000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  return `฿ ${Number(millions.toFixed(1))}M`;
}

/** Signed YTD P&L, e.g. `12.4` → "+12.4%", `-1.5` → "-1.5%". */
export function formatPlYtdPct(pct: number): string {
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

/**
 * A THB amount at exactly two decimals, grouped — 1234.5 → "1,234.50".
 *
 * Renders the value as given, so a negative amount keeps its own minus sign.
 * That is what separates it from {@link formatThbAmount}, which takes the
 * absolute value and puts the sign back on itself: use this one wherever the
 * caller composes the sign (or knows the value is non-negative), and that one
 * where a leading "+"/"−" is part of the format.
 */
export function formatThbDecimal(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * A whole-baht amount with the symbol — 2140000 → "฿ 2,140,000".
 *
 * Sits between the other two on purpose. {@link formatAumThb} rounds to ฿2.1M,
 * which is right for a book total and wrong for a margin top-up: an IC reading
 * it off to a client over the phone needs the figure that will actually clear
 * the call. {@link formatThbDecimal} keeps every baht but always draws two
 * decimals, and "2,140,000.00" claims a precision a threshold figure does not
 * have.
 */
export function formatThbWhole(amount: number): string {
  return `฿ ${Math.round(amount).toLocaleString("en-US")}`;
}

export function formatThbAmount(amount: number, withSign = false): string {
  const formatted = formatThbDecimal(Math.abs(amount));
  if (!withSign) return formatted;
  return `${amount >= 0 ? "+" : "-"}${formatted}`;
}

export function formatThaiUpdatedAt(now: Date): { date: string; time: string } {
  return {
    date: now.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: now.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

export function buildHeroSummaryFromClient(client: ClientSummaryInput): AssetHeroSummary {
  const updatedAt = formatThaiUpdatedAt(new Date());
  const aumThb = client.aum;
  const cash = aumThb * (client.cashIdlePct / 100);
  const lineAvailable = aumThb * LINE_AVAILABLE_RATIO;
  // `plYtdPct` carries its own sign, so this is the old
  // `abs(pct) * (plPositive ? 1 : -1)` written directly.
  const plChange = aumThb * (client.plYtdPct / 100);
  const changePercent = aumThb > 0 ? (plChange / aumThb) * 100 : 0;

  return {
    netValue: formatThbAmount(aumThb),
    changeAmount: formatThbAmount(plChange, true),
    changePercent: Math.abs(changePercent).toFixed(2),
    changePositive: plChange >= 0,
    lineAvailable: formatThbAmount(lineAvailable),
    cash: formatThbAmount(cash),
    lastUpdatedDate: updatedAt.date,
    lastUpdatedTime: updatedAt.time,
  };
}

export function formatLiabilitiesStr(aumThb: number): string {
  return formatThbAmount(aumThb * LIABILITIES_MULTIPLIER);
}

export function parseAmount(value: string): number {
  return parseFloat(value.replace(/,/g, "")) || 0;
}

/**
 * Initials for an avatar: first + last word initial, or the first two
 * characters for a single-word name. Purely presentational — safe to compute
 * from either a real or a masked name.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Initials from the first two words, e.g. "Somchai Rattanakul" → "SR".
 * Differs from {@link getInitials} on 3+ word and masked single-token names
 * (here "S*****" → "S"); kept as a distinct helper to preserve existing output.
 */
export function getInitialsFromWords(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * A single leading character — what the design system's `Avatar` actually shows:
 * its `initials` prop is documented as one character and ignores the rest, so
 * feeding it either two-character helper above just wastes the second one.
 *
 * A third variant rather than a unification of the two above on purpose — see
 * their notes on how they diverge on masked and multi-word names.
 */
export function getInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? "?";
}

/** Compact THB in millions, e.g. 12_300_000 → "฿ 12M". */
export function formatMillionThb(thb: number): string {
  const m = thb / 1_000_000;
  return `฿ ${m.toLocaleString("en-US", { maximumFractionDigits: 0 })}M`;
}
