import type { ReactNode } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

/** Shared "nothing here" placeholder — used for empty tabs and empty table results alike. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  actionSlot,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  /** Quiet text-link action. Ignored when `actionSlot` is given. */
  action?: { label: string; onClick: () => void };
  /**
   * A rendered action, for surfaces where the empty state *is* the call to
   * action and a link reads too quietly — pass a real `Button`. Kept separate
   * from `action` rather than changing what `action` renders, so the existing
   * link-style call sites are untouched.
   */
  actionSlot?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-[400px] text-center">
      {icon}
      <p className="type-subtitle-1 font-semibold text-[var(--text-default-secondary)]">{title}</p>
      <p className="type-body-2 text-[var(--text-default-tertiary)] max-w-xs">{body}</p>
      {actionSlot ? (
        <div className="mt-1">{actionSlot}</div>
      ) : (
        action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1 text-body-sm font-medium text-primary-action hover:underline cursor-pointer"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

/** Height floor a table's container needs so {@link TableEmptyOverlay} has room to
 *  fill. The container must also be `relative` — unconditionally, so that dropping
 *  it never moves the containing block of anything else positioned inside. */
export const TABLE_EMPTY_MIN_HEIGHT = "min-h-[448px]";

/**
 * "No search results" state for a filtered table: absolutely positioned over
 * the table body (from just under the ~48px header row down), so the real
 * header — and its column widths — stay visible behind it.
 *
 * The container needs `relative` plus {@link TABLE_EMPTY_MIN_HEIGHT} for this to lay out.
 */
export function TableEmptyOverlay({
  body,
  onClearFilters,
}: {
  body: string;
  onClearFilters?: () => void;
}) {
  return (
    <div className="absolute inset-x-0 top-12 bottom-0 flex items-center justify-center bg-[var(--bg-default-primary,white)]">
      <EmptyState
        icon={<MagnifyingGlassIcon size={40} className="text-[var(--text-default-placeholder)]" />}
        title="ไม่พบข้อมูลที่ค้นหา"
        body={body}
        action={onClearFilters ? { label: "ล้างตัวกรอง", onClick: onClearFilters } : undefined}
      />
    </div>
  );
}
