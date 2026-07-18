/**
 * @file kanban-board.tsx
 * @module components/kanban/kanban-board
 *
 * @description
 * The shared Kanban board — a horizontal row of {@link "@/components/kanban/kanban-column" KanbanColumnView}s,
 * each hosting a stack of {@link "@/components/kanban/kanban-card" KanbanCard}s.
 * The board owns the grouping (`groupBy`), the drag/keyboard plumbing (via
 * {@link "@/components/kanban/use-kanban-drag" useKanbanDrag}), and the empty-state
 * fallback per column. Feature modules only provide:
 *
 *  1. `columns`      — the ordered lane definitions.
 *  2. `cards`        — every record to lay out.
 *  3. `groupBy`      — how to assign a card to a column.
 *  4. `renderCard`   — how to render the inside of a card.
 *  5. `onMove`       — what to do when a card is dropped in a new column.
 *
 * Wave one keeps the board card-order-agnostic: we only fire `onMove` when a
 * card lands in a *different* column. Intra-column re-ordering is stubbed out
 * behind a `TODO(kanban-order)` in the drag hook.
 */

import { cn } from "@stackra/ui/react";
import { useMemo } from "react";

import type {
  KanbanBoardProps,
  KanbanCard as KanbanCardShape,
} from "@/components/kanban/kanban-board.types";
import type { ReactNode } from "react";

import { KanbanCard } from "@/components/kanban/kanban-card";
import { KanbanColumnView } from "@/components/kanban/kanban-column";
import { useKanbanDrag } from "@/components/kanban/use-kanban-drag";

/**
 * Buckets cards into columns using the caller-supplied `groupBy`. Cards whose
 * group id isn't in {@link columnIds} are silently dropped so the board never
 * renders a stray orphan bucket.
 */
function bucketCards<TCard extends KanbanCardShape, TColumnId extends string>(
  cards: TCard[],
  columnIds: TColumnId[],
  groupBy: (card: TCard) => TColumnId | undefined,
): Map<TColumnId, TCard[]> {
  const buckets = new Map<TColumnId, TCard[]>();

  // Pre-seed every column with an empty array so the render loop can rely on
  // `buckets.get(column.id)` returning `[]` for empty lanes (instead of the
  // sentinel `undefined` that `noUncheckedIndexedAccess` would surface).
  for (const id of columnIds) {
    buckets.set(id, []);
  }

  for (const card of cards) {
    const id = groupBy(card);

    if (id === undefined) {
      continue;
    }

    const bucket = buckets.get(id);

    if (bucket) {
      bucket.push(card);
    }
  }

  return buckets;
}

/**
 * The shared Kanban board. See file docblock for the responsibilities split
 * between board / column / card.
 *
 * @typeParam TCard - The card record shape.
 * @typeParam TColumnId - Union of allowed column ids on this board.
 */
export function KanbanBoard<TCard extends KanbanCardShape, TColumnId extends string = string>({
  ariaLabel,
  columns,
  cards,
  groupBy,
  renderCard,
  onMove,
  renderColumnEmptyState,
  className,
}: KanbanBoardProps<TCard, TColumnId>): ReactNode {
  const columnIds = useMemo(() => columns.map((column) => column.id), [columns]);

  const {
    activeCardId,
    hoveredColumn,
    grabbedCardId,
    previewColumn,
    getCardDragProps,
    getColumnDropProps,
    getCardKeyDownHandler,
  } = useKanbanDrag<TColumnId>({ columns, onMove });

  // Group the cards once per render; the grouping is cheap enough that memo
  // yields more surface than benefit, but the useMemo pins the reference so
  // downstream shallow-equal checks don't rebubble.
  const bucketed = useMemo(
    () => bucketCards(cards, columnIds, groupBy),
    [cards, columnIds, groupBy],
  );

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        // Horizontal scrolling row of columns. `min-h-[420px]` keeps the
        // empty state legible on the shortest supported viewport; callers
        // can override with `className`.
        "flex min-h-[420px] gap-4 overflow-x-auto pb-3",
        className,
      )}
      role="group"
    >
      {columns.map((column) => {
        const columnCards = bucketed.get(column.id) ?? [];

        return (
          <KanbanColumnView<TColumnId>
            key={column.id}
            column={column}
            count={columnCards.length}
            dropProps={getColumnDropProps(column.id)}
            emptyState={renderColumnEmptyState?.(column)}
            isDragHovered={hoveredColumn === column.id}
            isKeyboardPreview={previewColumn === column.id}
          >
            {columnCards.map((card, index) => (
              <KanbanCard
                key={card.id}
                ariaLabel={`Card ${card.id} in ${column.label}`}
                dragProps={getCardDragProps(card.id, column.id, index)}
                isDragging={activeCardId === card.id}
                isGrabbed={grabbedCardId === card.id}
                onKeyDown={getCardKeyDownHandler(card.id, column.id, index)}
              >
                {renderCard(card)}
              </KanbanCard>
            ))}
          </KanbanColumnView>
        );
      })}
    </div>
  );
}
