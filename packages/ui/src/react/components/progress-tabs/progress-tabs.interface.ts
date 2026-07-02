/**
 * @file progress-tabs.interface.ts
 * @module @stackra/ui/react/components/progress-tabs
 * @description Props and type interfaces for the ProgressTabs component.
 */

import type { ReactNode } from "react";

// ============================================================================
// Types
// ============================================================================

/** Status of a single progress step. */
export type ProgressStatus = "not-started" | "in-progress" | "completed";

// ============================================================================
// Context Interface
// ============================================================================

/** Internal context value shared across compound components. */
export interface IProgressTabsContextValue {
  /** The currently active tab key. */
  activeKey: string;

  /** Update the active tab key. */
  setActiveKey: (key: string) => void;

  /** Ordered list of registered step keys. */
  steps: string[];

  /** Register a step key (called by Trigger on mount). */
  registerStep: (key: string) => void;
}

// ============================================================================
// Component Props
// ============================================================================

/** Props for the root ProgressTabs container. */
export interface ProgressTabsProps {
  /** The currently active tab key (controlled). */
  selectedKey?: string;

  /** The default active tab key (uncontrolled). */
  defaultSelectedKey?: string;

  /** Callback fired when the active tab changes. */
  onSelectionChange?: (key: string) => void;

  /** Size variant. */
  size?: "sm" | "md" | "lg";

  /** Additional CSS classes for the root container. */
  className?: string;

  /** Tab triggers and panels. */
  children?: ReactNode;
}

/** Props for the ProgressTabs.List component. */
export interface ProgressTabsListProps {
  /** Accessibility label for the tab list. */
  "aria-label"?: string;

  /** Additional CSS classes. */
  className?: string;

  /** Tab triggers. */
  children?: ReactNode;
}

/** Props for a single ProgressTabs.Trigger step tab. */
export interface ProgressTabsTriggerProps {
  /** Unique key identifying this tab. */
  value: string;

  /** Current progress status of this step. */
  status?: ProgressStatus;

  /** Whether this trigger is disabled. */
  isDisabled?: boolean;

  /** Additional CSS classes. */
  className?: string;

  /** Trigger label content. */
  children?: ReactNode;
}

/** Props for the ProgressTabs.Content panel. */
export interface ProgressTabsContentProps {
  /** Key matching the corresponding trigger value. */
  value: string;

  /** Additional CSS classes. */
  className?: string;

  /** Panel content. */
  children?: ReactNode;
}
