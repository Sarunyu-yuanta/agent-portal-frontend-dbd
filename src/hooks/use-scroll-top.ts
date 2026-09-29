"use client";

import { useEffect } from "react";

/**
 * Put the page back at the top when `deps` change.
 *
 * The App Router already resets scroll on navigation — but only for whatever
 * the *document* scrolls, and in this shell the document does not scroll at
 * all: `<main>` owns the overflow so the header and sidebar can stay put. Next
 * has no way to reach into it, so arriving on a page inherits whatever scroll
 * offset the previous one left behind, and a drill-in opens halfway down.
 *
 * `window.scrollTo` is the fallback for any tree rendered outside that shell.
 *
 * @param deps what counts as "a different page" — the route param a drill-in is
 * keyed on, or `[]` for a page that should simply always open at the top.
 */
export function useScrollTopOnChange(deps: readonly unknown[]) {
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
    else window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller owns what "a different page" means
  }, deps);
}
