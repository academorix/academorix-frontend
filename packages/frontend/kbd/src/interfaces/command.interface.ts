/**
 * @fileoverview Command — registered command-palette entry.
 *
 * Commands are the entries surfaced through the ⌘K palette. They can
 * point to a route (`to`) or invoke a handler (`handler`). Each command
 * may bind a {@link KeyCombo} so it also works without opening the
 * palette.
 *
 * @module @stackra/kbd
 * @category Interfaces
 */

import type { ReactNode } from "react";

import type { KeyCombo } from "./key-combo.interface";

/**
 * Per-command runtime context, supplied by {@link CommandPaletteService}.
 */
export interface CommandContext {
  /** Free-form params passed by the trigger (e.g. selected record id). */
  params?: Record<string, unknown>;
  /** Closes the palette. */
  close: () => void;
  /** Opens a child palette (push navigation). */
  pushQuery?: (query: string) => void;
}

/**
 * Function executed when a command is selected.
 */
export type CommandHandler = (ctx: CommandContext) => void | Promise<void>;

/**
 * A tag rendered as a chip next to the command label.
 */
export interface CommandTag {
  /** Tag label text. */
  label: string;
  /** Optional color variant. */
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

/**
 * Common fields shared by every command variant.
 */
interface CommandBase {
  /** Stable id (used for selection / dedupe). */
  id: string;
  /** Human-readable label rendered in the palette. */
  label: string;
  /** Optional secondary description / hint. */
  description?: string;
  /**
   * Search keywords (in addition to `label` + `description`).
   * Useful for synonyms ("logout", "sign out", "exit").
   */
  keywords?: string[];
  /** Optional leading icon. */
  icon?: ReactNode;
  /**
   * Type id (matches a {@link CommandType.id}). Used for grouping.
   * Defaults to `"general"`.
   */
  type?: string;
  /**
   * Backwards-compatible alias for {@link CommandBase.type}.
   */
  category?: string;
  /** Optional tags rendered as chips next to the label. */
  tags?: CommandTag[];
  /**
   * Optional ordering hint within a category. Lower values appear first.
   *
   * @default 0
   */
  order?: number;
  /** Optional keyboard combo bound to the command. */
  shortcut?: KeyCombo;
  /** Hide from search results when `true`. */
  hidden?: boolean;
  /** Disable the command (renders dimmed, won't fire). */
  disabled?: boolean;
  /**
   * Free-form metadata bag. Common keys:
   * - `entity` — string label rendered as the entity chip ("Product").
   * - `entityId` — id of the underlying record.
   * - `source` — id of the {@link CommandSource} that produced the entry.
   * - `analytics` — `{ event, params }` object fired on invocation.
   */
  meta?: Record<string, unknown>;
}

/**
 * A command that invokes a handler function when selected.
 */
export interface CommandWithHandler extends CommandBase {
  /** The handler to invoke. */
  handler: CommandHandler;
  /** Route commands don't have a handler. */
  to?: never;
}

/**
 * A command that navigates to a route when selected.
 */
export interface CommandWithRoute extends CommandBase {
  /** Route path to navigate to. */
  to: string;
  /** Route commands don't have a handler. */
  handler?: never;
}

/**
 * Discriminated union of every command variant.
 */
export type Command = CommandWithHandler | CommandWithRoute;

/**
 * A pluggable source that returns commands at runtime.
 *
 * Apps register sources (e.g. recent pages, recent searches, dynamic
 * resources) through `KbdModule.forFeature({ sources })`. The palette
 * queries every source on every keystroke (debounced).
 */
export interface CommandSource {
  /** Stable id for the source. */
  id: string;
  /** Optional label used as the section heading in the palette. */
  label?: string;
  /** Type id surfaced when the source omits `type` on its commands. */
  defaultType?: string;
  /** Optional priority — lower values run first when merging results. */
  priority?: number;
  /**
   * Resolve commands matching `query`.
   *
   * `query` is the user's raw search input (already trimmed). Sources
   * may return synchronous arrays or promises. Implementations should
   * honour `signal.aborted` to cancel inflight work.
   */
  resolve(query: string, context: { signal?: AbortSignal }): Command[] | Promise<Command[]>;
}
