/**
 * @file use-kanban-drag.test.ts
 * @module components/kanban/__tests__/use-kanban-drag.test
 *
 * @description
 * Unit tests for the {@link useKanbanDrag} hook. We exercise both the pointer
 * path (fabricated `dataTransfer` payload driving `onDragStart` +
 * `onDragOver` + `onDrop`) and the keyboard path (Enter to grab, ArrowRight
 * to preview, Enter to commit), and assert that `onMove` fires with the
 * expected `(cardId, fromColumn, toColumn, order)` tuple.
 *
 * These tests intentionally live under `__tests__/` because they hold the
 * fake `DataTransfer` scaffolding — kept out of the component's directory so
 * the runtime bundle doesn't pick up test helpers by mistake.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { KanbanColumn } from "@/components/kanban/kanban-board.types";
import type { DragEvent as ReactDragEvent, KeyboardEvent as ReactKeyboardEvent } from "react";

import { useKanbanDrag } from "@/components/kanban/use-kanban-drag";

/** The MIME type the hook writes to `dataTransfer`; kept in sync with the source. */
const DRAG_MIME = "application/x-academorix-kanban-card";

/** A tiny two-column board for the tests to move cards between. */
type ColumnId = "new" | "won";
const COLUMNS: KanbanColumn<ColumnId>[] = [
  { id: "new", label: "New" },
  { id: "won", label: "Won" },
];

/**
 * Builds a fake `DataTransfer`-like object that satisfies the hook's needs
 * without depending on the DOM's real class. Payloads are stored on a plain
 * map keyed by MIME type; `types` exposes the same keys.
 */
function createFakeDataTransfer(): DataTransfer {
  const store = new Map<string, string>();

  const fake = {
    effectAllowed: "none" as string,
    dropEffect: "none" as string,
    get types(): readonly string[] {
      return Array.from(store.keys());
    },
    setData(format: string, value: string): void {
      store.set(format, value);
    },
    getData(format: string): string {
      return store.get(format) ?? "";
    },
    clearData(): void {
      store.clear();
    },
  };

  // TS's built-in `DataTransfer` type includes lots of methods we don't need.
  // The hook only touches the surface above, so the cast is safe.
  return fake as unknown as DataTransfer;
}

/**
 * Builds a fake React drag event whose `dataTransfer` we can inspect after
 * the hook writes into it. The hook only reads `dataTransfer` + calls
 * `preventDefault`, so we mock exactly those two.
 */
function createDragEvent(
  dataTransfer: DataTransfer,
): ReactDragEvent<HTMLElement> & { preventDefault: ReturnType<typeof vi.fn> } {
  return {
    dataTransfer,
    preventDefault: vi.fn(),
    relatedTarget: null,
    currentTarget: { contains: () => false } as unknown as HTMLElement,
  } as unknown as ReactDragEvent<HTMLElement> & {
    preventDefault: ReturnType<typeof vi.fn>;
  };
}

/** Builds a fake React keyboard event exposing only what the hook reads. */
function createKeyEvent(key: string): ReactKeyboardEvent<HTMLElement> & {
  preventDefault: ReturnType<typeof vi.fn>;
} {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as ReactKeyboardEvent<HTMLElement> & {
    preventDefault: ReturnType<typeof vi.fn>;
  };
}

describe("useKanbanDrag", () => {
  describe("pointer drag lifecycle", () => {
    it("marks the dragged card as active when onDragStart fires", () => {
      const { result } = renderHook(() =>
        useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove: vi.fn() }),
      );

      const cardProps = result.current.getCardDragProps("card-1", "new", 0);
      const dataTransfer = createFakeDataTransfer();
      const event = createDragEvent(dataTransfer);

      act(() => {
        cardProps.onDragStart(event);
      });

      expect(result.current.activeCardId).toBe("card-1");
      // The payload is serialised onto the custom MIME type so the drop
      // handler can decode `(cardId, fromColumn, order)` back out.
      expect(dataTransfer.getData(DRAG_MIME)).toContain('"cardId":"card-1"');
      expect(dataTransfer.effectAllowed).toBe("move");
    });

    it("resets active state when onDragEnd fires (even without a drop)", () => {
      const { result } = renderHook(() =>
        useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove: vi.fn() }),
      );

      const cardProps = result.current.getCardDragProps("card-1", "new", 0);
      const dataTransfer = createFakeDataTransfer();

      act(() => {
        cardProps.onDragStart(createDragEvent(dataTransfer));
      });

      act(() => {
        cardProps.onDragEnd(createDragEvent(dataTransfer));
      });

      expect(result.current.activeCardId).toBeNull();
      expect(result.current.hoveredColumn).toBeNull();
    });

    it("highlights the hovered column while a drag is in flight", () => {
      const { result } = renderHook(() =>
        useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove: vi.fn() }),
      );

      const cardProps = result.current.getCardDragProps("card-1", "new", 0);
      const dataTransfer = createFakeDataTransfer();

      act(() => {
        cardProps.onDragStart(createDragEvent(dataTransfer));
      });

      const dropProps = result.current.getColumnDropProps("won");

      act(() => {
        dropProps.onDragEnter(createDragEvent(dataTransfer));
      });

      expect(result.current.hoveredColumn).toBe("won");
    });

    it("fires onMove with (cardId, fromColumn, toColumn, order) on drop", () => {
      const onMove = vi.fn();
      const { result } = renderHook(() => useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove }));

      const cardProps = result.current.getCardDragProps("card-1", "new", 0);
      const dataTransfer = createFakeDataTransfer();

      // Simulate the full pointer lifecycle: dragStart → dragEnter →
      // dragOver → drop.
      act(() => {
        cardProps.onDragStart(createDragEvent(dataTransfer));
      });

      const dropProps = result.current.getColumnDropProps("won");

      act(() => {
        dropProps.onDragEnter(createDragEvent(dataTransfer));
      });

      act(() => {
        dropProps.onDragOver(createDragEvent(dataTransfer));
      });

      act(() => {
        dropProps.onDrop(createDragEvent(dataTransfer));
      });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith("card-1", "new", "won", 0);
    });

    it("does not fire onMove when the drag payload is missing (external drop)", () => {
      const onMove = vi.fn();
      const { result } = renderHook(() => useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove }));

      // No `onDragStart` — we simulate a drop from outside the board (e.g.
      // dragging text onto the column). The hook should treat this as a
      // no-op.
      const emptyTransfer = createFakeDataTransfer();
      const dropProps = result.current.getColumnDropProps("won");

      act(() => {
        dropProps.onDrop(createDragEvent(emptyTransfer));
      });

      expect(onMove).not.toHaveBeenCalled();
    });

    it("silently ignores a drop with a malformed payload", () => {
      const onMove = vi.fn();
      const { result } = renderHook(() => useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove }));

      const dataTransfer = createFakeDataTransfer();

      // Write a payload that looks close but isn't valid JSON.
      dataTransfer.setData(DRAG_MIME, "{not-json");

      const dropProps = result.current.getColumnDropProps("won");

      act(() => {
        dropProps.onDrop(createDragEvent(dataTransfer));
      });

      expect(onMove).not.toHaveBeenCalled();
    });
  });

  describe("keyboard grab lifecycle", () => {
    it("enters grabbed mode on the first Enter press and previews the source column", () => {
      const { result } = renderHook(() =>
        useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove: vi.fn() }),
      );

      const onKeyDown = result.current.getCardKeyDownHandler("card-1", "new", 0);

      act(() => {
        onKeyDown(createKeyEvent("Enter"));
      });

      expect(result.current.grabbedCardId).toBe("card-1");
      expect(result.current.previewColumn).toBe("new");
    });

    it("moves the preview forward on ArrowRight, back on ArrowLeft (with wrap)", () => {
      const { result } = renderHook(() =>
        useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove: vi.fn() }),
      );

      // Re-fetch the handler after each render — `useCallback` re-creates it
      // whenever the internal state closes over changes, so a stale reference
      // would fire against the wrong closure.
      const invoke = (key: string): void => {
        act(() => {
          result.current.getCardKeyDownHandler("card-1", "new", 0)(createKeyEvent(key));
        });
      };

      invoke("Enter");

      // ArrowRight from "new" → "won" (second column).
      invoke("ArrowRight");
      expect(result.current.previewColumn).toBe("won");

      // ArrowRight from "won" wraps to "new".
      invoke("ArrowRight");
      expect(result.current.previewColumn).toBe("new");

      // ArrowLeft from "new" wraps back to "won".
      invoke("ArrowLeft");
      expect(result.current.previewColumn).toBe("won");
    });

    it("fires onMove and resets when Enter commits the previewed column", () => {
      const onMove = vi.fn();
      const { result } = renderHook(() => useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove }));

      const invoke = (key: string): void => {
        act(() => {
          result.current.getCardKeyDownHandler("card-1", "new", 0)(createKeyEvent(key));
        });
      };

      invoke("Enter");
      invoke("ArrowRight");
      invoke("Enter");

      expect(onMove).toHaveBeenCalledWith("card-1", "new", "won", 0);
      expect(result.current.grabbedCardId).toBeNull();
      expect(result.current.previewColumn).toBeNull();
    });

    it("resets grabbed state on Escape without firing onMove", () => {
      const onMove = vi.fn();
      const { result } = renderHook(() => useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove }));

      const invoke = (key: string): void => {
        act(() => {
          result.current.getCardKeyDownHandler("card-1", "new", 0)(createKeyEvent(key));
        });
      };

      invoke("Enter");
      invoke("ArrowRight");
      invoke("Escape");

      expect(onMove).not.toHaveBeenCalled();
      expect(result.current.grabbedCardId).toBeNull();
    });

    it("ignores arrow keys when no card is grabbed", () => {
      const { result } = renderHook(() =>
        useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove: vi.fn() }),
      );

      const onKeyDown = result.current.getCardKeyDownHandler("card-1", "new", 0);

      act(() => {
        onKeyDown(createKeyEvent("ArrowRight"));
      });

      // No grab → no preview state should have been created.
      expect(result.current.grabbedCardId).toBeNull();
      expect(result.current.previewColumn).toBeNull();
    });

    it("space acts as Enter for grab + commit", () => {
      const onMove = vi.fn();
      const { result } = renderHook(() => useKanbanDrag<ColumnId>({ columns: COLUMNS, onMove }));

      const invoke = (key: string): void => {
        act(() => {
          result.current.getCardKeyDownHandler("card-1", "new", 0)(createKeyEvent(key));
        });
      };

      invoke(" ");
      expect(result.current.grabbedCardId).toBe("card-1");

      invoke("ArrowRight");
      invoke(" ");

      expect(onMove).toHaveBeenCalledWith("card-1", "new", "won", 0);
    });
  });
});
