/**
 * @file kanban-card.tsx
 * @module components/kanban/kanban-card
 *
 * @description
 * The draggable + keyboard-focusable shell every Kanban card renders inside.
 * The shell owns the interaction plumbing — `draggable` attribute, HTML5 drag
 * handlers, keyboard "grab" handler, focus outline, ARIA affordances. The
 * feature-module `renderCard` callback owns the *content* (name, chips, meta),
 * so leads and safeguarding kanbans reuse the same interaction skeleton
 * without inheriting each other's layout choices.
 *
 * The shell is intentionally NOT a `<button>`: cards behave as drop-target
 * *sources* (roughly ARIA `role="listitem"` behind the scenes via
 * `aria-roledescription`), not as buttons that fire on click. Modules that
 * want a click-to-open interaction wrap the content in their own `<Link>`.
 */

import { cn } from "@stackra/ui/react";
import { forwardRef } from "react";

import type { KanbanCardDragProps } from "@/components/kanban/use-kanban-drag";
import type { HTMLAttributes, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";

/** Props for {@link KanbanCard}. */
export interface KanbanCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onKeyDown"> {
  /** The card body — usually a small stack of chips and meta rows. */
  children: ReactNode;
  /**
   * Spread output of {@link "@/components/kanban/use-kanban-drag" useKanbanDrag}'s
   * `getCardDragProps`. Bundles the `draggable` attribute + the drag start /
   * end handlers so the caller drops one prop onto the card element.
   */
  dragProps: KanbanCardDragProps;
  /** Fires the keyboard-grab handler from `useKanbanDrag`. */
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
  /**
   * Screen-reader label for the card. Modules pass a semantically meaningful
   * string like `"Lead: Jordan Reyes · Qualified"` so the audible name isn't
   * the raw record id.
   */
  ariaLabel: string;
  /**
   * Whether the drag hook currently considers this card the one being dragged
   * via a pointer. Renders a slightly translucent + scaled affordance so the
   * user knows which card is following the cursor.
   */
  isDragging?: boolean;
  /**
   * Whether the drag hook currently has this card grabbed via keyboard mode.
   * Renders a persistent outline (thicker than focus-visible) so the user
   * knows the arrow keys will move it.
   */
  isGrabbed?: boolean;
}

/**
 * The draggable/keyboard-focusable card shell. Consumers pass the drag
 * handlers from `useKanbanDrag`, an aria-label, and the body — the shell
 * takes care of the rest.
 *
 * Forwarded ref lets callers focus the card programmatically after a
 * keyboard-driven move (see the board component for that plumbing).
 */
export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(function KanbanCard(
  {
    children,
    dragProps,
    onKeyDown,
    ariaLabel,
    isDragging = false,
    isGrabbed = false,
    className,
    ...rest
  },
  ref,
) {
  return (
    <div
      ref={ref}
      // `aria-roledescription` gives assistive tech a friendly noun ("draggable
      // card") instead of the generic "button" that `role="button"` announces.
      // We use `role="button"` (not `role="listitem"`) because the card is
      // genuinely interactive — Enter/Space activate keyboard-grab mode and
      // pointer press-drag moves the card between columns. That satisfies
      // jsx-a11y's "no non-interactive tabindex / interactions" rules by
      // matching the semantic role to the actual behaviour.
      aria-grabbed={isGrabbed || undefined}
      aria-label={ariaLabel}
      aria-roledescription="draggable card"
      className={cn(
        // Base card look — subtle border, small radius, hover elevation.
        "flex cursor-grab flex-col gap-2 rounded-md border border-border bg-surface p-3 text-left shadow-sm outline-none",
        // Focus + focus-visible: consistent with the rest of the app's rings.
        "transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
        // While the card is being dragged by the pointer, dim + shrink it so
        // the visual stays lightweight without blocking underlying rows.
        isDragging && "cursor-grabbing opacity-60",
        // While the card is keyboard-grabbed, render a persistent accent
        // outline that survives focus loss on child interactive elements.
        isGrabbed && "ring-2 ring-accent ring-offset-1",
        className,
      )}
      role="button"
      tabIndex={0}
      onKeyDown={onKeyDown}
      {...dragProps}
      {...rest}
    >
      {children}
    </div>
  );
});
