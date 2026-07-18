/**
 * @file dashboard-template.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Template descriptor used by the "New dashboard" dialog.
 *   Each template seeds an initial widget set + layout.
 */

import type { DashboardLayoutMode } from "@/core/types/dashboard-layout-mode.type";

/**
 * Blueprint used to materialise a new dashboard. The materialiser
 * runs auto-layout across every breakpoint so first render is
 * sensible without hand-picking coordinates per template.
 */
export interface IDashboardTemplate {
  /** Stable template identifier. */
  id: string;

  /** Short human-facing name shown as the card title. */
  name: string;

  /** One-line description shown on the picker card. */
  description: string;

  /** Iconify token from the shared icon set. */
  icon: string;

  /** Optional accent colour applied to the freshly-created dashboard. */
  color?: string;

  /** Layout engine mode the template targets. */
  layoutMode: DashboardLayoutMode;

  /**
   * Ordered catalogue keys the template seeds. The materialiser
   * auto-layouts them into the responsive grid.
   */
  keys: readonly string[];
}
