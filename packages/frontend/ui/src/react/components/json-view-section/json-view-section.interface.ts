/**
 * @file json-view-section.interface.ts
 * @module @stackra/ui/react/components/json-view-section
 * @description Props interfaces for the JsonViewSection component.
 */

// ============================================================================
// Component Props
// ============================================================================

/** Props for the JsonViewSection component. */
export interface JsonViewSectionProps {
  /** The data object to display as formatted JSON. */
  data: Record<string, unknown> | unknown[];

  /** Section title shown in the disclosure trigger. */
  title?: string;

  /** Whether the section is initially expanded. */
  defaultExpanded?: boolean;

  /** Whether to show the copy-to-clipboard button. */
  showCopy?: boolean;

  /** Maximum height of the code block before scrolling (CSS value). */
  maxHeight?: string;

  /** Number of spaces for JSON indentation. */
  indentation?: number;

  /** Additional CSS classes for the container. */
  className?: string;
}
