/**
 * @file pattern-lock.interface.ts
 * @module @stackra/ui/react/components/pattern-lock
 * @description Props interfaces for the PatternLock component.
 */

// ============================================================================
// Types
// ============================================================================

/** 2D point used internally for grid calculations. */
export interface Point2D {
  /** X coordinate. */
  x: number;
  /** Y coordinate. */
  y: number;
}

// ============================================================================
// Component Props
// ============================================================================

/** Props for the PatternLock component. */
export interface PatternLockProps {
  /** Current path (array of point indices). Controlled. */
  path: number[];

  /** Callback when the path changes during drawing. */
  onChange: (path: number[]) => void;

  /** Callback when drawing finishes (finger/mouse lifted). */
  onFinish: () => void;

  /** Grid size (3 = 3x3, 4 = 4x4, etc.). */
  size?: number;

  /** Width and height of the grid container in pixels. */
  width?: number;

  /** Size of inactive dots in pixels. */
  pointSize?: number;

  /** Active area size per dot (touch target) in pixels. */
  pointActiveSize?: number;

  /** Thickness of connector lines in pixels. */
  connectorThickness?: number;

  /** Whether the component is disabled. */
  isDisabled?: boolean;

  /** Whether to show error state (red dots/connectors). */
  isError?: boolean;

  /** Whether to show success state (green dots/connectors). */
  isSuccess?: boolean;

  /** Whether to hide connectors (security mode). */
  isInvisible?: boolean;

  /** Whether to allow jumping over intermediate points. */
  allowJumping?: boolean;

  /** Additional CSS classes. */
  className?: string;
}
