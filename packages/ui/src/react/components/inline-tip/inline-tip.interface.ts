/**
 * @file inline-tip.interface.ts
 * @module @stackra/ui/react/components/inline-tip
 * @description Props interfaces for the InlineTip component.
 */

import type { ReactNode } from "react";

// ============================================================================
// Component Props
// ============================================================================

/** Visual variant for the inline tip. */
export type InlineTipVariant = "info" | "warning" | "error" | "success" | "tip";

/** Props for the InlineTip component. */
export interface InlineTipProps {
  /** Semantic variant controlling color and icon. */
  variant?: InlineTipVariant;

  /** Optional title displayed in bold above the message. */
  title?: string;

  /** Tip message body (text or JSX). */
  children: ReactNode;

  /** Additional CSS classes for the container. */
  className?: string;

  /** Whether the tip can be dismissed. */
  dismissible?: boolean;

  /** Callback when dismissed. */
  onDismiss?: () => void;
}
