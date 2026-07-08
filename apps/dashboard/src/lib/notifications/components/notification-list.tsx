/**
 * @file notification-list.tsx
 * @module notifications/components/notification-list
 *
 * @description
 * The scrollable list body inside the drawer + full-page inbox. Given
 * an already-filtered array of {@link RenderableNotification}s, it
 * renders one {@link NotificationRow} per entry or the empty state
 * when the list is empty.
 *
 * ## Why the parent filters + we do not
 *
 * The drawer owns section / category / channel filters (each with its
 * own analytics event); passing an already-narrowed array keeps this
 * component pure and testable in isolation.
 *
 * ## Infinite scroll — deferred
 *
 * notifications module calls for `useInfiniteQuery`-driven pagination.
 * We ship without it in Phase 1 because:
 *
 *   - The inbox is a bounded LRU (~200 entries) in the shared context.
 *   - The backend does not yet emit stable cursors — the `Cursor`
 *     paginator is coming with the Communication module's Phase 2.
 *
 * TODO(backend-gap): once `GET /notifications?cursor=…` lands, replace
 *   the static array with an `IntersectionObserver`-driven cursor fetch.
 */

import type { RenderableNotification } from "@/lib/notifications/types";
import type { ReactNode } from "react";

import { NotificationEmptyState } from "@/lib/notifications/components/notification-empty-state";
import { NotificationRow } from "@/lib/notifications/components/notification-row";

/** Props for {@link NotificationList}. */
export interface NotificationListProps {
  /** Already filtered + sorted (newest-first) rows. */
  readonly entries: readonly RenderableNotification[];
  /** Passed to each row so a click can close the parent surface. */
  readonly onRowAction?: () => void;
  /** Renders the empty state at page or drawer size. */
  readonly emptyVariant?: "drawer" | "page";
  /** Test hook: pinned "now" for stable relative-time output. */
  readonly now?: Date;
}

/**
 * The drawer/page list body. Renders the empty state when `entries`
 * is empty, else a `<ul>` with one row per entry.
 *
 * @remarks
 * We use a semantic `<ul>` + `<li>` structure (rather than a
 * `<div>`-only tree) so screen readers announce "list of 12
 * notifications" — HeroUI Pro's `ListView` would give us the same
 * benefit but with more DOM overhead than we need for a bounded
 * inbox.
 */
export function NotificationList({
  entries,
  onRowAction,
  emptyVariant = "drawer",
  now,
}: NotificationListProps): ReactNode {
  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <NotificationEmptyState variant={emptyVariant} onNavigate={onRowAction} />
      </div>
    );
  }

  return (
    <ul
      aria-label="Notifications"
      className="divide-y divide-border overflow-y-auto"
      data-testid="notification-list"
    >
      {entries.map((entry) => (
        <li key={entry.notification.id}>
          <NotificationRow entry={entry} now={now} onAction={onRowAction} />
        </li>
      ))}
    </ul>
  );
}
