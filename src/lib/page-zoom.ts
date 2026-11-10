/**
 * The zoom `app/typography.css` puts on the whole page on very wide screens
 * (120% at 1920px and up); 1 everywhere else.
 *
 * Under it the browser reports two kinds of pixel. `getBoundingClientRect()`
 * and `window.innerWidth/innerHeight` are screen pixels. `scrollTop`,
 * `offsetTop`, `clientHeight` and any value written to `style` are the page's
 * own pixels, which the zoom then scales. Divide screen pixels by this before
 * mixing the two, or the result is off by 25% on those screens.
 */
export function pageZoom(): number {
  if (typeof document === "undefined") return 1;
  return parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
}
