"use client";

import { Children, useRef, useState, type ReactNode } from "react";
import { useIsoLayoutEffect } from "@/hooks/use-iso-layout-effect";
import { cn } from "@/lib/utils";

/**
 * How long a step change takes to slide.
 *
 * A number here *and* `duration-200` in the markup below, because only one of
 * the two can be a Tailwind class: a caller that retires a pane's content once
 * it has left needs a timer that outlasts the transition. Keep them in step.
 */
export const SLIDE_MS = 200;

/**
 * Steps inside a modal that slide past each other instead of swapping.
 *
 * Every child is one pane (an empty one — `null`, `false` — still counts),
 * laid side by side on a strip that translates to `index`. All panes stay mounted — Back lands on the previous step exactly as
 * it was left (scroll, search, ticks). The box animates its height to the
 * active pane's, measured, because a modal sized to its content would otherwise
 * stay at the tallest pane with dead space under the shorter one.
 *
 * Content that is *cleared* on Back (a selected record, say) has to lag behind
 * the live state, or the pane empties while it is still sliding out: keep a
 * second "shown" state, set it together with the live one going forward and
 * clear it (or don't) only after `SLIDE_MS`. See `OrderBookingModal`.
 *
 * Load-bearing details, all from the copies this replaced:
 * - `items-start` on the strip. A flex row stretches its children to the
 *   tallest, which is the box — whose height comes from measuring a pane — so
 *   every pane would measure the same and the height would freeze.
 * - `overflow-clip`, not `hidden`: a `hidden` box becomes the scrollport any
 *   sticky header inside a pane sticks to, and this box never scrolls.
 * - `inert` on the off-screen panes, so Tab and screen readers stay on the
 *   step that is showing.
 */
export function SlideSteps({
  index,
  className,
  initialHeight,
  onHeightChange,
  children,
}: {
  index: number;
  className?: string;
  /**
   * The height to start from, when this track replaces another in the same
   * box — "สร้าง Order" swapping its order steps for its Proposal steps. The
   * new track first paints at the old one's height and then animates to its
   * own, instead of the box jumping. Read on mount only.
   */
  initialHeight?: number;
  /** Every height the box settles on — for the next track's `initialHeight`. */
  onHeightChange?: (height: number) => void;
  children: ReactNode;
}) {
  // `count`/`map`, not `toArray`: an empty slot (`{contact && …}`) is still a
  // pane — `toArray` would drop it and shift every index after it.
  const count = Math.max(Children.count(children), 1);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [height, setHeight] = useState<number | undefined>(initialHeight);
  /** Whether the inherited height has been painted once — see below. */
  const settled = useRef(initialHeight === undefined);
  const report = useRef(onHeightChange);
  useIsoLayoutEffect(() => {
    report.current = onHeightChange;
  });

  useIsoLayoutEffect(() => {
    let frame = 0;
    const measure = () => {
      const active = refs.current[index];
      if (!active) return;
      const next = active.offsetHeight;
      report.current?.(next);
      if (settled.current) {
        setHeight(next);
        return;
      }
      // Starting from an inherited height: let it reach the screen first, or
      // the measured one replaces it before paint and there is nothing to
      // animate from.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        settled.current = true;
        setHeight(next);
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    refs.current.forEach((el) => el && observer.observe(el));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [index, count]);

  return (
    <div
      className={cn(
        "overflow-clip transition-[height] duration-200 ease-out motion-reduce:transition-none",
        className,
      )}
      style={{ height }}
    >
      <div
        className="flex items-start transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{
          width: `${count * 100}%`,
          transform: `translateX(-${(index * 100) / count}%)`,
        }}
      >
        {Children.map(children, (pane, i) => (
          <div
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="shrink-0"
            style={{ width: `${100 / count}%` }}
            inert={i !== index}
          >
            {pane}
          </div>
        ))}
      </div>
    </div>
  );
}
