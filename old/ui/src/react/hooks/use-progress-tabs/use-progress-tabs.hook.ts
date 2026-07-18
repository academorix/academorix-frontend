/**
 * @file use-progress-tabs.hook.ts
 * @module @stackra/ui/react/components/progress-tabs/hooks
 * @description Hook to consume the ProgressTabs context from sub-components.
 */

import { useContext } from "react";

import { ProgressTabsContext } from "../../contexts/progress-tabs";

import type { IProgressTabsContextValue } from "../../components/progress-tabs/progress-tabs.interface";

/**
 * Access the ProgressTabs compound component context.
 *
 * Must be called from within a `<ProgressTabs>` tree.
 *
 * @returns The context value with activeKey, steps, and navigation methods
 * @throws Error if called outside of ProgressTabs
 */
export function useProgressTabs(): IProgressTabsContextValue {
  const ctx = useContext(ProgressTabsContext);

  if (!ctx) {
    throw new Error("useProgressTabs: must be used within a <ProgressTabs> component.");
  }

  return ctx;
}
