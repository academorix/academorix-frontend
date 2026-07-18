/**
 * @file section-container.interface.ts
 * @module @stackra/ui/react/components/section-container
 * @description Props interfaces for the SectionContainer component.
 */

import type { ReactNode } from "react";

// ============================================================================
// Component Props
// ============================================================================

/** Props for the SectionContainer component. */
export interface SectionContainerProps {
  /** Section title displayed at the top. */
  title: string;

  /** Optional subtitle/description below the title. */
  description?: string;

  /** Optional action rendered in the top-right corner (button, link, etc.). */
  action?: ReactNode;

  /** Section body content. */
  children?: ReactNode;

  /** Additional CSS classes for the container. */
  className?: string;

  /** Whether to show a divider between header and content. */
  showDivider?: boolean;
}
