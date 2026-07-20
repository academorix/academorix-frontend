/**
 * @file progress-accordion.interface.ts
 * @module @stackra/ui/react/components/progress-accordion
 * @description Props interfaces for the ProgressAccordion compound component.
 */

import type { ReactNode } from "react";

// ============================================================================
// Types
// ============================================================================

/** Progress status for an individual accordion section. */
export type AccordionSectionStatus = "not-started" | "in-progress" | "completed";

// ============================================================================
// Component Props
// ============================================================================

/** Props for the root ProgressAccordion container. */
export interface ProgressAccordionProps {
  /** Controlled set of expanded section keys. */
  expandedKeys?: Set<string>;

  /** Default expanded section keys (uncontrolled). */
  defaultExpandedKeys?: Set<string>;

  /** Callback when expanded sections change. */
  onExpandedChange?: (keys: Set<string>) => void;

  /** Whether multiple sections can be expanded simultaneously. */
  allowMultiple?: boolean;

  /** Accordion sections. */
  children: ReactNode;

  /** Additional CSS classes for the root container. */
  className?: string;
}

/** Props for a single ProgressAccordion.Item section. */
export interface ProgressAccordionItemProps {
  /** Unique key for this section. */
  value: string;

  /** Section title displayed in the trigger. */
  title: string;

  /** Optional description below the title. */
  description?: string;

  /** Progress status indicator for this section. */
  status?: AccordionSectionStatus;

  /** Whether this section is disabled (cannot expand). */
  isDisabled?: boolean;

  /** Section body content rendered when expanded. */
  children: ReactNode;

  /** Additional CSS classes for the item. */
  className?: string;
}
