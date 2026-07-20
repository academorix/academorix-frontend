/**
 * @file status-badge.interface.ts
 * @module @stackra/ui/react/components/status-badge
 * @description Props interfaces for the StatusBadge component.
 */

// ============================================================================
// Component Props
// ============================================================================

/** Semantic color variant for the status badge. */
export type StatusBadgeColor = "success" | "warning" | "danger" | "default" | "accent";

/** Props for the StatusBadge component. */
export interface StatusBadgeProps {
  /** Text label displayed next to the dot. */
  label: string;

  /** Semantic color for the dot and text. */
  color?: StatusBadgeColor;

  /** Additional CSS classes for the badge wrapper. */
  className?: string;
}
