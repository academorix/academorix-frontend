/**
 * @file use-kanban-drag.ts
 * @module components/kanban/use-kanban-drag
 *
 * @description
 * Tiny HTML5 drag-and-drop coordinator for the shared Kanban board. We do NOT
 * pull in `react-beautiful-dnd`, `dnd-kit`, or `pragmatic-drag-and-drop` — the
 * board's shape is simple enough (one drop zone per column, cards move
 * columns) that the native `HTMLDragEvent` API is both smaller and leaner.
 *
 * ## Behaviour
 *
 *  1. **Pointer drag** — the caller wires:
 *       - `getCardDragProps(cardId, fromColumn, order)` → the `draggable`,
 *         `onDragStart`, and `onDragEnd` handlers on the card element.
 *       - `getColumnDropProps(toColumn)` → the `onDragOver`, `onDragEnter`,
 *         `onDragLeave`, and `onDrop` handlers on the column body.
 *     On drop the hook fires `onMove(cardId, fromColumn, toColumn, order)`.
 *
 *  2. **Keyboard fallback** — `getCardKeyDownHandler(cardId, fromColumn, order)`
 *     lets a keyboard-only user move a card:
 *       - `Enter` / `Space` on a focused card: enter "grabbed" mode.
 *       - `ArrowLeft` / `ArrowRight`: preview the move to the previous or next
 *         column relative to `fromColumn` (uses the caller-supplied ordered
 *         column id list). Wraps by design — the user hits `ArrowRight` on
 *         the last lane and lands back on the first.
 *       - `Enter` / `Space` again: commit the move.
 *       - `Escape`: cancel.
 *     The hook surfaces `grabbedCardId` + `previewColumn` so the board can
 *     render a keyboard-focus outline on the target column.
 *
 * The hook is intentionally UI-free — it returns handlers and a small piece
 * of state, and lets the board decide how to render.
 *
 * @see DASHBOARD_UX_PLAN.md §5.7 (keyboard fallback rules)
 */

import { useCallback, useMemo, useState } from "react";

import type {
  KanbanColumn,
  KanbanMoveHandler,
} from "@/components/kanban/kanban-board.types";
import type {
  DragEvent as ReactDragEvent,
  DragEventHandler,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";

/**
 * MIME type used on the `DataTransfer` payload. Custom vendor types keep the
 * board's drag events distinct from a native browser drag (file upload,
 * external text drop). The value is arbitrary but must match on drag+drop.
 */
const DRAG_MIME = "application/x-academorix-kanban-card";

/**
 * Handlers a caller spreads onto a card's outer element to make it draggable.
 * Kept as a plain interface (not a hook return tuple) so it composes with
 * `<div {...cardDragProps}>` at the JSX site.
 */
export interface KanbanCardDragProps {
  /** HTML5 draggable attribute — always `true` for a kanban card. */
  draggable: true;
  onDragStart: DragEventHandler<HTMLElement>;
  onDragEnd: DragEventHandler<HTMLElement>;
}

/** Handlers a caller spreads onto a column body element to make it a drop zone. */
export interface KanbanColumnDropProps {
  onDragOver: DragEventHandler<HTMLElement>;
  onDragEnter: DragEventHandler<HTMLElement>;
  onDragLeave: DragEventHandler<HTMLElement>;
  onDrop: DragEventHandler<HTMLElement>;
}

/** Public API of the drag hook. */
export interface UseKanbanDragReturn<TColumnId extends string> {
  /** The card currently being dragged, or `null` when idle. */
  activeCardId: string | null;
  /** The column the user is currently hovering, or `null` when idle. */
  hoveredColumn: TColumnId | null;
  /**
   * The card currently in keyboard-grab mode, or `null`. When set, the caller
   * paints a distinct outline on the card so users know they are moving it.
   */
  grabbedCardId: string | null;
  /**
   * The column that keyboard preview is currently pointing at, or `null` when
   * no card is grabbed. Callers render a focus ring on the matching column.
   */
  previewColumn: TColumnId | null;
  /** Handlers for a draggable card element. */
  getCardDragProps: (
    cardId: string,
    fromColumn: TColumnId,
    order: number,
  ) => KanbanCardDragProps;
  /** Handlers for a droppable column element. */
  getColumnDropProps: (toColumn: TColumnId) => KanbanColumnDropProps;
  /** Keyboard-move handler for a focused card. */
  getCardKeyDownHandler: (
    cardId: string,
    fromColumn: TColumnId,
    order: number,
  ) => (event: ReactKeyboardEvent<HTMLElement>) => void;
}

/**
 * Options for {@link useKanbanDrag}.
 *
 * @typeParam TColumnId - The union of column ids on the board.
 */
export interface UseKanbanDragOptions<TColumnId extends string> {
  /**
   * The ordered column list — used to resolve keyboard arrow-left/right moves.
   * The board already carries this in its props, so callers usually pass the
   * same array reference through.
   */
  columns: KanbanColumn<TColumnId>[];
  /** Fired on a successful drop (pointer or keyboard). */
  onMove: KanbanMoveHandler<TColumnId>;
}

/**
 * The DataTransfer payload we serialise on drag start. Stringified onto a
 * custom MIME type so it survives the round trip through `dataTransfer`.
 */
interface DragPayload {
  cardId: string;
  fromColumn: string;
  order: number;
}

/** Serialise the drag payload for `dataTransfer.setData`. */
function encodePayload(payload: DragPayload): string {
  return JSON.stringify(payload);
}

/**
 * Parse the drag payload from `dataTransfer.getData`. Returns `null` when the
 * MIME type is missing or the JSON is malformed — the board treats a null
 * payload as a no-op, so an external drag (file upload, browser text drop)
 * never fires an `onMove`.
 */
function decodePayload(raw: string): DragPayload | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DragPayload>;

    if (
      typeof parsed.cardId === "string" &&
      typeof parsed.fromColumn === "string" &&
      typeof parsed.order === "number"
    ) {
      return parsed as DragPayload;
    }
  } catch {
    // Fall through — malformed JSON is treated the same as a missing payload.
  }

  return null;
}

/**
 * Coordinates HTML5 drag + keyboard-driven card moves for the shared Kanban
 * board. See the file docblock for the interaction model.
 *
 * @typeParam TColumnId - The union of column ids on the board.
 */
export function useKanbanDrag<TColumnId extends string>({
  columns,
  onMove,
}: UseKanbanDragOptions<TColumnId>): UseKanbanDragReturn<TColumnId> {
  // Track the drag currently in flight. We store this in React state so the
  // board can render a visual affordance on the source card + target column,
  // AND on a plain ref so `onDrop` can read the source column without stale
  // closure worries. The ref-backed value is not strictly necessary now (React
  // events are synchronous within a single dispatch), but it documents intent.
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<TColumnId | null>(null);
  const [grabbedCardId, setGrabbedCardId] = useState<string | null>(null);
  const [grabbedFromColumn, setGrabbedFromColumn] = useState<TColumnId | null>(null);
  const [grabbedOrder, setGrabbedOrder] = useState<number>(0);
  const [previewColumn, setPreviewColumn] = useState<TColumnId | null>(null);

  // Order the caller-supplied column ids so keyboard arrow moves wrap
  // predictably. Memoised on the columns array so we recompute only when the
  // caller passes a new list.
  const columnIds = useMemo(() => columns.map((column) => column.id), [columns]);

  /** Reset every drag/keyboard state slot back to idle. */
  const resetDrag = useCallback((): void => {
    setActiveCardId(null);
    setHoveredColumn(null);
  }, []);

  const resetKeyboard = useCallback((): void => {
    setGrabbedCardId(null);
    setGrabbedFromColumn(null);
    setGrabbedOrder(0);
    setPreviewColumn(null);
  }, []);

  const getCardDragProps = useCallback(
    (cardId: string, fromColumn: TColumnId, order: number): KanbanCardDragProps => ({
      draggable: true,
      onDragStart: (event: ReactDragEvent<HTMLElement>) => {
        // The payload survives the drag through `dataTransfer`. We ALSO track
        // it in React state so intra-app affordances (source card ghost,
        // target column highlight) render immediately without waiting for the
        // browser to bubble a `dragover` event to the right column.
        const payload: DragPayload = { cardId, fromColumn, order };

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(DRAG_MIME, encodePayload(payload));
        // The `text/plain` copy exists so external drop targets (browser URL
        // bar, other apps) receive something legible instead of an empty
        // string. It plays no role inside the board.
        event.dataTransfer.setData("text/plain", cardId);
        setActiveCardId(cardId);
      },
      onDragEnd: () => {
        // Fires regardless of drop success — clear state either way so the
        // affordances don't linger after a cancelled drag (Escape, drop off
        // the board, etc.).
        resetDrag();
      },
    }),
    [resetDrag],
  );

  const getColumnDropProps = useCallback(
    (toColumn: TColumnId): KanbanColumnDropProps => ({
      onDragOver: (event: ReactDragEvent<HTMLElement>) => {
        // Calling `preventDefault` inside `dragover` is the HTML5 signal to
        // the browser that the element is a valid drop target. Without this,
        // `onDrop` never fires and the cursor shows the "not allowed" glyph.
        if (event.dataTransfer.types.includes(DRAG_MIME)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }
      },
      onDragEnter: (event: ReactDragEvent<HTMLElement>) => {
        if (event.dataTransfer.types.includes(DRAG_MIME)) {
          setHoveredColumn(toColumn);
        }
      },
      onDragLeave: (event: ReactDragEvent<HTMLElement>) => {
        // `dragleave` fires as the pointer moves between the column and its
        // descendants; only clear the affordance when the pointer actually
        // exits the column bounds. `relatedTarget` is the element being
        // entered — when it's still a descendant, keep the highlight.
        const nextTarget = event.relatedTarget as Node | null;
        const currentTarget = event.currentTarget;

        if (nextTarget && currentTarget.contains(nextTarget)) {
          return;
        }

        setHoveredColumn((current) => (current === toColumn ? null : current));
      },
      onDrop: (event: ReactDragEvent<HTMLElement>) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData(DRAG_MIME);
        const payload = decodePayload(raw);

        resetDrag();

        if (!payload) {
          // No valid payload — either an external drag or a stale event we
          // shouldn't react to. Silent no-op keeps the board deterministic.
          return;
        }

        // For now we drop at the end of the target column. Order-aware
        // insertion would require the column to expose per-card drop zones,
        // which is out of scope for the first cut — see PLAN §5.7 for the
        // future work.
        // TODO(kanban-order): support intra-column ordering by computing the
        // drop index from the mouse Y-position relative to each card.
        const nextOrder = payload.fromColumn === toColumn ? payload.order : 0;

        onMove(payload.cardId, payload.fromColumn as TColumnId, toColumn, nextOrder);
      },
    }),
    [onMove, resetDrag],
  );

  const getCardKeyDownHandler = useCallback(
    (cardId: string, fromColumn: TColumnId, order: number) =>
      (event: ReactKeyboardEvent<HTMLElement>): void => {
        // Cancel any in-flight keyboard grab when the user presses Escape.
        if (event.key === "Escape") {
          if (grabbedCardId === cardId) {
            event.preventDefault();
            resetKeyboard();
          }

          return;
        }

        // Enter or Space toggles the grabbed state on the focused card — the
        // first press "picks up" the card, the second press "drops" it into
        // the currently previewed column.
        if (event.key === "Enter" || event.key === " ") {
          if (grabbedCardId === cardId && previewColumn && grabbedFromColumn) {
            event.preventDefault();
            onMove(cardId, grabbedFromColumn, previewColumn, grabbedOrder);
            resetKeyboard();

            return;
          }

          if (grabbedCardId === null) {
            event.preventDefault();
            setGrabbedCardId(cardId);
            setGrabbedFromColumn(fromColumn);
            setGrabbedOrder(order);
            setPreviewColumn(fromColumn);
          }

          return;
        }

        // Arrow keys only matter while a card is grabbed — keyboard focus
        // navigation without a grab falls through to the browser default.
        if (grabbedCardId !== cardId) {
          return;
        }

        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          const currentIndex = previewColumn
            ? columnIds.indexOf(previewColumn)
            : columnIds.indexOf(fromColumn);
          const delta = event.key === "ArrowRight" ? 1 : -1;
          const length = columnIds.length;

          if (length === 0 || currentIndex < 0) {
            return;
          }

          event.preventDefault();
          // Wrap around so the caret can circle the board without the user
          // having to shift-tab across the whole page.
          const nextIndex = (currentIndex + delta + length) % length;
          const nextColumn = columnIds[nextIndex];

          if (nextColumn) {
            setPreviewColumn(nextColumn);
          }
        }
      },
    [
      columnIds,
      grabbedCardId,
      grabbedFromColumn,
      grabbedOrder,
      onMove,
      previewColumn,
      resetKeyboard,
    ],
  );

  return {
    activeCardId,
    hoveredColumn,
    grabbedCardId,
    previewColumn,
    getCardDragProps,
    getColumnDropProps,
    getCardKeyDownHandler,
  };
}
