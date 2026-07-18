/**
 * @file dashboard-layout.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Legacy saved-dashboard-layout descriptor. Owners can
 *   promote a personal layout to a tenant preset via `scope: "tenant"`;
 *   the picker groups presets separately from personal layouts.
 */

import type { IDashboardLayoutBreakpoint } from "./dashboard-layout-breakpoint.interface";

/**
 * Saved dashboard layout (legacy shape).
 */
export interface IDashboardLayout {
  /** UUID primary key. */
  id: string;

  /** Human-facing name. */
  name: string;

  /** Whether this layout is the current user's default. */
  isDefault: boolean;

  /**
   * Layout ownership scope.
   *
   * - `user` — personal layout.
   * - `role` — role preset shared by every user with that role.
   * - `tenant` — tenant-wide preset published by an admin.
   */
  scope: "user" | "role" | "tenant";

  /** Layouts keyed by breakpoint. */
  breakpoints: Record<"lg" | "md" | "sm", IDashboardLayoutBreakpoint>;
}
