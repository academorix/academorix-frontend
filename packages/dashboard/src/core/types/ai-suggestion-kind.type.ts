/**
 * @file ai-suggestion-kind.type.ts
 * @module @stackra/dashboard/core/types
 * @description The kinds of change an AI suggestion can propose. Kept as
 *   a literal union so switch statements narrow cleanly at the call site.
 */

/**
 * AI suggestion kind.
 *
 * - `add-widget` — insert a fresh widget instance. Payload:
 *   `{ widgetType: string; span?: WidgetSpan }`.
 * - `reorder` — reorder existing widgets by id. Payload:
 *   `{ orderedIds: readonly string[] }`.
 * - `rename` — patch the dashboard's display name. Payload:
 *   `{ name: string }`.
 * - `explain` — no mutation; a summary emitted when the assistant
 *   can't infer a concrete change (fallback branch).
 */
export type AiSuggestionKind = "add-widget" | "reorder" | "rename" | "explain";
