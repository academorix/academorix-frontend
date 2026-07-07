/**
 * @file index.ts
 * @module components/kanban
 *
 * @description
 * Public barrel for the shared Kanban board — the reusable layout used by
 * `modules/leads/pages/kanban.tsx` and `modules/safeguarding/pages/kanban.tsx`.
 * Feature modules import from `@/components/kanban`, never from the individual
 * files, so the internal file layout stays free to change.
 */

export { KanbanBoard } from "@/components/kanban/kanban-board";
export { KanbanCard } from "@/components/kanban/kanban-card";
export { KanbanColumnView } from "@/components/kanban/kanban-column";
export {
  useKanbanDrag,
  type KanbanCardDragProps,
  type KanbanColumnDropProps,
  type UseKanbanDragOptions,
  type UseKanbanDragReturn,
} from "@/components/kanban/use-kanban-drag";
export type {
  KanbanBoardProps,
  KanbanCard as KanbanCardShape,
  KanbanColumn,
  KanbanColumnColor,
  KanbanMoveHandler,
} from "@/components/kanban/kanban-board.types";
