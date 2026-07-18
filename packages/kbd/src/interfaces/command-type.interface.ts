/**
 * @fileoverview CommandType — taxonomy of commands and shortcuts.
 *
 * Replaces hardcoded enums (`pageShortcut`, `settingShortcut`, ...) with
 * a proper registry. Apps register their own types through
 * {@link KbdModule.forFeature}. Each shortcut / command points to a
 * type by id; the help overlay and command palette use the type to
 * group, sort, and label entries.
 *
 * @module @stackra/kbd
 * @category Interfaces
 */

import type { ReactNode } from "react";

/**
 * Single category of commands / shortcuts.
 *
 * Built-in defaults shipped by the kbd module:
 * - `navigation` — routing shortcuts (page navigation, anchors, search).
 * - `action` — invoke an action without leaving the page.
 * - `entity` — operate on a specific record (selected row, focused item).
 * - `setting` — open settings panes / modals.
 * - `tool` — utility commands (debug, theme switch, locale switch).
 * - `general` — fallback when no other type fits.
 *
 * Apps register additional types via `KbdModule.forFeature({ types })`.
 */
export interface CommandType {
  /** Stable id (e.g. `"navigation"`, `"products"`). */
  id: string;

  /** Display label rendered in the help overlay / palette. */
  label: string;

  /**
   * Optional sort order — lower values appear first when grouping.
   *
   * @default 100
   */
  order?: number;

  /** Optional leading icon shown next to the type label. */
  icon?: ReactNode;

  /**
   * Optional secondary description shown under the type label in the
   * palette / catalog.
   */
  description?: string;

  /**
   * Optional badge color when rendering the type on items as a chip
   * (matches HeroUI `Chip` color tokens).
   *
   * @default "default"
   */
  color?: "default" | "primary" | "secondary" | "tertiary" | "success" | "warning" | "danger";

  /**
   * Hide the type from the help overlay (entries still resolve at
   * runtime, they just don't appear in the catalog).
   *
   * @default false
   */
  hidden?: boolean;
}
