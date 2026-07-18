/**
 * @file kanban-board.types.ts
 * @module components/kanban/kanban-board.types
 *
 * @description
 * Shared type surface for the reusable Kanban board:
 *
 *  - {@link KanbanColumn}: the description of one lane in the board (id,
 *    label, optional accent color, optional WIP limit).
 *  - {@link KanbanCard}: the minimum shape a card must carry so the layout
 *    can key + group + render it. Feature modules extend this with their own
 *    record fields.
 *  - {@link KanbanMoveHandler}: the callback the drag hook fires when a card
 *    lands in a new column.
 *  - {@link KanbanBoardProps}: the props the shared {@link "@/components/kanban/kanban-board" KanbanBoard}
 *    exposes to feature modules.
 *
 * These live in a dedicated file so the drag hook, column, card, and board
 * can all import them without a circular loop through `index.ts`.
 */

import type { ReactNode } from "react";

/**
 * The HeroUI Chip color palette we let feature modules pipe into a column
 * header. Kept narrow to match the tokens the design system exposes — anything
 * outside this list would break `<Chip color=...>` in `@stackra/ui/react`.
 */
export type KanbanColumnColor = "default" | "success" | "warning" | "danger";

/** The minimum shape a card must have so the board can key + group it. */
export interface KanbanCard {
  /** Stable identifier used as the React key and the drag payload. */
  id: string;
}

/**
 * A single column in the board. `columnId` is a stable string (usually the
 * enum value the module keys on, e.g. `"qualified"` or `"escalated"`).
 */
export interface KanbanColumn<TColumnId extends string = string> {
  /** Stable id — matches the value a card carries on its status/stage field. */
  id: TColumnId;
  /** Human-readable label rendered in the column header. */
  label: string;
  /**
   * Optional accent color for the column's WIP indicator + count chip. Feature
   * modules use this to align a lane with its status semantics (e.g. `won`
   * columns render green, `lost` columns render red).
   */
  color?: KanbanColumnColor;
  /**
   * Optional Work-In-Progress ceiling. When set and the column holds more
   * cards than the limit, the count chip flips into `danger` to signal the
   * overflow. Not enforced — the board never blocks a drop; it just warns.
   */
  wipLimit?: number;
  /**
   * Optional description rendered under the label. Kept short — one line.
   * Feature modules use it for "New leads awaiting first contact"-style
   * subtitles.
   */
  description?: string;
}

/**
 * Fired by the drag hook when a card is dropped on a new column. Feature
 * modules wire this to Refine's `useUpdate` to persist the move — see
 * `modules/leads/pages/kanban.tsx` for the canonical wiring.
 *
 * The `order` argument is the target index inside `toColumn` (0-based). Same
 * source and target column with a different `order` means an intra-column
 * reorder; the shared board fires it as a move for both cases so modules that
 * don't care about ordering can just look at `fromColumn` vs `toColumn`.
 *
 * @param cardId - The dragged card's `id`.
 * @param fromColumn - The column the card was moved out of.
 * @param toColumn - The column the card was moved into.
 * @param order - Zero-based drop index inside `toColumn`.
 */
export type KanbanMoveHandler<TColumnId extends string = string> = (
  cardId: string,
  fromColumn: TColumnId,
  toColumn: TColumnId,
  order: number,
) => void;

/**
 * Public props for {@link "@/components/kanban/kanban-board" KanbanBoard}.
 *
 * @typeParam TCard - The card record type. Must extend {@link KanbanCard}.
 * @typeParam TColumnId - The union of allowed column ids for this board.
 */
export interface KanbanBoardProps<TCard extends KanbanCard, TColumnId extends string = string> {
  /** Accessible label for the whole board (announced by screen readers). */
  ariaLabel: string;
  /**
   * Ordered list of columns. Board renders one lane per entry; the visual
   * left-to-right order matches this array.
   */
  columns: KanbanColumn<TColumnId>[];
  /**
   * All cards to place across the columns. The board groups them by
   * `groupBy(card)` — usually a lookup to a `stage` or `status` field on the
   * feature module's record.
   */
  cards: TCard[];
  /**
   * Extracts the column id a card belongs to. Returning `undefined` (or an
   * id that isn't in {@link columns}) drops the card silently — the board
   * never renders orphan cards.
   */
  groupBy: (card: TCard) => TColumnId | undefined;
  /**
   * Renders the card body. The board owns the draggable/focusable shell (see
   * {@link "@/components/kanban/kanban-card" KanbanCard}); modules only supply
   * what goes inside it (name, chips, meta rows).
   */
  renderCard: (card: TCard) => ReactNode;
  /**
   * Fired when a card is dropped on a new column. Modules typically wire this
   * to Refine's `useUpdate` with optimistic mode + rollback on error.
   */
  onMove: KanbanMoveHandler<TColumnId>;
  /**
   * Called to build a per-column empty state. Modules that need a custom CTA
   * (like leads' "New lead in this stage") pass this; when omitted the board
   * falls back to a plain "No cards" message.
   */
  renderColumnEmptyState?: (column: KanbanColumn<TColumnId>) => ReactNode;
  /**
   * Optional class appended to the outer scroll container. Modules that need
   * a taller/shorter viewport override the default (`min-h-[420px]`).
   */
  className?: string;
}
