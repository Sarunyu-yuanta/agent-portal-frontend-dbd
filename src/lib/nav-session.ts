"use client";

/**
 * Storage layer for navigation memory, with one rule baked in: **a fresh
 * document load starts empty.**
 *
 * A refresh is a deliberate "start over" — the user should get default tabs,
 * default filters, top-of-page and a clean back trail, not a resumed session.
 * Closing the tab already wipes sessionStorage; this makes reload behave the
 * same way. The URL is untouched, so a refreshed or shared deep link still
 * opens exactly what it names.
 *
 * The reset hangs off module scope rather than a load event: a reload evaluates
 * this module in a brand-new JS context (flag false → clear), while
 * client-side navigation keeps the same one (flag true → keep). No listener to
 * race, and nothing to clean up.
 */

import { safeStorage } from "./web-storage";

const PREFIX = "nav:";

let cleared = false;

const store = () => safeStorage("session");

function clearOnce(s: Storage) {
  if (cleared) return;
  cleared = true;
  try {
    const stale: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i);
      if (key?.startsWith(PREFIX)) stale.push(key);
    }
    for (const key of stale) s.removeItem(key);
  } catch {
    /* nothing to clear is a fine outcome */
  }
}

export function navRead(key: string): string | null {
  const s = store();
  if (!s) return null;
  clearOnce(s);
  try {
    return s.getItem(key);
  } catch {
    return null;
  }
}

export function navWrite(key: string, value: string) {
  const s = store();
  if (!s) return;
  clearOnce(s);
  try {
    s.setItem(key, value);
  } catch {
    /* quota — see navRead */
  }
}

/** Explicitly forget one key — for a "leaving for good" action, as opposed to the transient remounts client-side navigation causes. */
export function navRemove(key: string) {
  const s = store();
  if (!s) return;
  clearOnce(s);
  try {
    s.removeItem(key);
  } catch {
    /* nothing to remove is a fine outcome */
  }
}
