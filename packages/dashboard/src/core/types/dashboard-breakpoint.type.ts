/**
 * @file dashboard-breakpoint.type.ts
 * @module @stackra/dashboard/core/types
 * @description Responsive breakpoint identifier the widget grid renders
 *   against. Matches `react-grid-layout`'s convention of one layout array
 *   per named breakpoint.
 */

/**
 * The three named breakpoints the widget grid understands.
 *
 * - `lg` — desktop viewport (12 columns by default).
 * - `md` — tablet viewport (8 columns).
 * - `sm` — phone viewport (4 columns).
 */
export type DashboardBreakpoint = "lg" | "md" | "sm";
