/**
 * @file kanban-column.tsx
 * @module components/kanban/kanban-column
 *
 * @description
 * One lane in the shared Kanban board. Owns the column header (label, count,
 * WIP indicator, optional description) and the drop zone (a scrollable body
 * that hosts the cards + an empty-state slot when the column is empty).
 *
 * The column does **not** render cards directly — the caller passes `children`
 * so the board can wire drag props per card. This keeps the column dumb: it
 * only knows how to render its own chrome + how to be a drop target.
 */

import { Chip, cn } from "@academorix/ui/react";

import type {
  KanbanColumn as KanbanColumnDef,
  KanbanColumnColor,
} from "@/components/kanban/kanban-board.types";
import type { KanbanColumnDropProps } from "@/components/kanban/use-kanban-drag";
import type { ReactNode } from "react";

/** Props for {@link KanbanColumnView}. */
export interface KanbanColumnViewProps<TColumnId extends string> {
  /** The column definition (id + label + optional color/WIP limit/description). */
  column: KanbanColumnDef<TColumnId>;
  /** Number of cards currently in the column — used by the header count chip. */
  count: number;
  /**
   * Spread output of {@link "@/components/kanban/use-kanban-drag" useKanbanDrag}'s
   * `getColumnDropProps`. Bundles the four drag events (`over`, `enter`,
   * `leave`, `drop`) so the caller drops one prop onto the column body.
   */
  dropProps: KanbanColumnDropProps;
  /** The card list — rendered as `<KanbanCard>` children by the board. */
  children: ReactNode;
  /**
   * Rendered under the card list when there are no cards. The board owns the
   * empty state so leads can offer a "New lead in this stage" CTA and other
   * modules can render a plain message.
   */
  emptyState?: ReactNode;
  /**
   * Whether the drag hook currently reports the pointer hovering this column.
   * Used to paint a dashed accent border so the drop target is obvious.
   */
  isDragHovered?: boolean;
  /**
   * Whether the keyboard-grab preview currently points at this column. Same
   * visual as `isDragHovered` — kept as a separate flag so the caller can
   * distinguish pointer-vs-keyboard states in the future without breaking
   * this component's contract.
   */
  isKeyboardPreview?: boolean;
}

/**
 * Maps the semantic column colors to concrete Tailwind classes that only
 * apply on the count chip. We can't `<Chip color={dynamic}>` with a `string`
 * union in TypeScript's noUncheckedIndexedAccess mode without narrowing, so
 * this exhaustive record does the mapping.
 */
const COUNT_CHIP_COLOR: Record<KanbanColumnColor, "default" | "success" | "warning" | "danger"> = {
  default: "default",
  success: "success",
  warning: "warning",
  danger: "danger",
};

/**
 * Renders one lane of the Kanban board. See file docblock.
 */
export function KanbanColumnView<TColumnId extends string>({
  column,
  count,
  dropProps,
  children,
  emptyState,
  isDragHovered = false,
  isKeyboardPreview = false,
}: KanbanColumnViewProps<TColumnId>): ReactNode {
  const isEmpty = count === 0;
  const isHighlighted = isDragHovered || isKeyboardPreview;

  // A column with a WIP limit that is currently exceeded shows its count chip
  // in danger so the operator knows the lane is over its budget. Otherwise it
  // uses the column's own accent color.
  const overWip = typeof column.wipLimit === "number" && count > column.wipLimit;
  const chipColor = overWip ? "danger" : COUNT_CHIP_COLOR[column.color ?? "default"];

  return (
    <section
      aria-label={`${column.label} — ${count} card${count === 1 ? "" : "s"}`}
      className={cn(
        // Fixed-width lane so the row stays scrollable on small viewports.
        // The board wraps the whole row in an overflow-x-auto container.
        "flex w-72 shrink-0 flex-col gap-3 rounded-lg border border-border bg-background p-3",
        // Highlight the drop target with an accent-tinted dashed border so
        // the affordance is unmistakable during a drag.
        isHighlighted && "border-dashed border-accent bg-accent/5",
      )}
      data-column-id={column.id}
    >
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            {column.label}
          </h2>
          <Chip color={chipColor} size="sm" variant="soft">
            <Chip.Label className="tabular-nums">
              {typeof column.wipLimit === "number" ? `${count} / ${column.wipLimit}` : count}
            </Chip.Label>
          </Chip>
        </div>
        {column.description ? (
          <p className="text-xs text-muted">{column.description}</p>
        ) : null}
      </header>

      <div
        // `role="group"` reflects the column body's semantic content — a
        // labelled group of interactive card buttons. We used to declare
        // `role="list"` + `role="listitem"` on cards, but the ESLint a11y
        // rules (correctly) rejected non-interactive list semantics on an
        // element that receives keyboard + drag events. `group` is the
        // right role for a labelled collection of interactive widgets.
        aria-label={`${column.label} cards`}
        className={cn(
          "flex min-h-[120px] flex-col gap-2 rounded-md",
          // A slightly recessed background makes the drop zone easy to
          // distinguish from the column chrome above.
          "bg-muted/5 p-2",
        )}
        data-testid={`kanban-column-body-${column.id}`}
        role="group"
        {...dropProps}
      >
        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border/60 px-3 py-6 text-center">
            {emptyState ?? (
              <p className="text-xs text-muted">No cards in this column</p>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
