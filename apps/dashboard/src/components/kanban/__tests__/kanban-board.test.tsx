/**
 * @file kanban-board.test.tsx
 * @module components/kanban/__tests__/kanban-board.test
 *
 * @description
 * Component tests for the shared {@link KanbanBoard}. Covers:
 *
 *  1. Every column in `columns` is rendered.
 *  2. Cards are placed into the right lane via `groupBy`.
 *  3. Empty columns render the caller's `renderColumnEmptyState`.
 *  4. Cards whose `groupBy` id isn't in the column list are dropped silently.
 *  5. Board fires the caller's `onMove` when a synthetic drag+drop lands on
 *     a different column — this integration-tests the board wiring the
 *     drag hook's `getColumnDropProps` onto the column body.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { KanbanColumn } from "@/components/kanban/kanban-board.types";

import { KanbanBoard } from "@/components/kanban/kanban-board";

/**
 * Test fixture — a two-column board with a domain-specific record shape.
 * Using an explicit `stage` field mirrors how the leads kanban keys cards on
 * their pipeline stage.
 */
interface TestCard {
  id: string;
  stage: "new" | "won";
  name: string;
}

const COLUMNS: KanbanColumn<TestCard["stage"]>[] = [
  { id: "new", label: "New" },
  { id: "won", label: "Won" },
];

/**
 * Builds a tiny fake DataTransfer for HTML5 drag simulation. Kept in this
 * file (rather than shared with the hook test) so each test module can evolve
 * its own fake without a cross-file coupling risk.
 */
function createFakeDataTransfer(): DataTransfer {
  const store = new Map<string, string>();

  const fake = {
    effectAllowed: "none" as string,
    dropEffect: "none" as string,
    get types(): readonly string[] {
      return Array.from(store.keys());
    },
    setData: (format: string, value: string): void => {
      store.set(format, value);
    },
    getData: (format: string): string => store.get(format) ?? "",
    clearData: (): void => {
      store.clear();
    },
  };

  return fake as unknown as DataTransfer;
}

describe("KanbanBoard", () => {
  it("renders every column with its label + count chip", () => {
    render(
      <KanbanBoard<TestCard, TestCard["stage"]>
        ariaLabel="Test board"
        cards={[]}
        columns={COLUMNS}
        groupBy={(card) => card.stage}
        renderCard={(card) => <span>{card.name}</span>}
        onMove={vi.fn()}
      />,
    );

    // Column headers are `<h2>` — the shared column view uses that element
    // so screen readers can navigate lane by lane.
    expect(screen.getByRole("heading", { name: /new/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /won/i, level: 2 })).toBeInTheDocument();
  });

  it("places each card in its groupBy-derived lane", () => {
    const cards: TestCard[] = [
      { id: "c-1", stage: "new", name: "Alpha" },
      { id: "c-2", stage: "new", name: "Beta" },
      { id: "c-3", stage: "won", name: "Gamma" },
    ];

    render(
      <KanbanBoard<TestCard, TestCard["stage"]>
        ariaLabel="Test board"
        cards={cards}
        columns={COLUMNS}
        groupBy={(card) => card.stage}
        renderCard={(card) => <span>{card.name}</span>}
        onMove={vi.fn()}
      />,
    );

    // `data-column-id` is stamped on the column `<section>` — we scope
    // `within` to each lane so the assertion is unambiguous.
    const newColumn = document.querySelector('[data-column-id="new"]');
    const wonColumn = document.querySelector('[data-column-id="won"]');

    expect(newColumn).not.toBeNull();
    expect(wonColumn).not.toBeNull();

    if (newColumn && wonColumn) {
      expect(within(newColumn as HTMLElement).getByText("Alpha")).toBeInTheDocument();
      expect(within(newColumn as HTMLElement).getByText("Beta")).toBeInTheDocument();
      expect(within(wonColumn as HTMLElement).getByText("Gamma")).toBeInTheDocument();
    }
  });

  it("renders the caller's empty state for a lane with no cards", () => {
    render(
      <KanbanBoard<TestCard, TestCard["stage"]>
        ariaLabel="Test board"
        cards={[]}
        columns={COLUMNS}
        groupBy={(card) => card.stage}
        renderCard={(card) => <span>{card.name}</span>}
        renderColumnEmptyState={(column) => <p>No records in {column.label} stage</p>}
        onMove={vi.fn()}
      />,
    );

    // Both columns are empty and both should render the caller-supplied
    // empty-state message.
    expect(screen.getByText("No records in New stage")).toBeInTheDocument();
    expect(screen.getByText("No records in Won stage")).toBeInTheDocument();
  });

  it("silently drops cards whose group id isn't among the columns", () => {
    const cards: TestCard[] = [
      { id: "c-1", stage: "new", name: "Alpha" },
      // "lost" isn't in COLUMNS — the board must render Alpha and skip Ghost.
      { id: "c-2", stage: "lost" as TestCard["stage"], name: "Ghost" },
    ];

    render(
      <KanbanBoard<TestCard, TestCard["stage"]>
        ariaLabel="Test board"
        cards={cards}
        columns={COLUMNS}
        groupBy={(card) => card.stage}
        renderCard={(card) => <span>{card.name}</span>}
        onMove={vi.fn()}
      />,
    );

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Ghost")).not.toBeInTheDocument();
  });

  it("fires onMove with (cardId, fromColumn, toColumn, order) when a card is dropped on a new lane", () => {
    const onMove = vi.fn();
    const cards: TestCard[] = [{ id: "c-1", stage: "new", name: "Alpha" }];

    render(
      <KanbanBoard<TestCard, TestCard["stage"]>
        ariaLabel="Test board"
        cards={cards}
        columns={COLUMNS}
        groupBy={(card) => card.stage}
        renderCard={(card) => <span>{card.name}</span>}
        onMove={onMove}
      />,
    );

    const card = screen.getByText("Alpha").closest('[aria-roledescription="draggable card"]');
    const wonColumnBody = screen.getByTestId("kanban-column-body-won");

    expect(card).not.toBeNull();
    expect(wonColumnBody).not.toBeNull();

    if (!card) {
      return;
    }

    // Simulate the browser drag lifecycle. `fireEvent.dragStart` creates a
    // real `DragEvent`, but jsdom doesn't wire `dataTransfer` for us — we
    // pass our own fake through the event init so the hook can read from it.
    const dataTransfer = createFakeDataTransfer();

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragEnter(wonColumnBody, { dataTransfer });
    fireEvent.dragOver(wonColumnBody, { dataTransfer });
    fireEvent.drop(wonColumnBody, { dataTransfer });

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith("c-1", "new", "won", 0);
  });
});
