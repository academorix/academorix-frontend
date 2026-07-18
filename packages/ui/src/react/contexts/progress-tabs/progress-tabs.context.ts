/**
 * @file progress-tabs.context.ts
 * @module @stackra/ui/react/contexts/progress-tabs
 * @description React context for ProgressTabs compound component state sharing.
 */

import { createContext } from "react";

// Relative import — matches the pattern in the sibling `.component.tsx`
// files (Vite dev server walks the workspace source directly).
import type { IProgressTabsContextValue } from "../../components/progress-tabs/progress-tabs.interface";

/**
 * ProgressTabs context — shares active key, step registry,
 * and navigation methods across compound sub-components.
 */
export const ProgressTabsContext = createContext<IProgressTabsContextValue | null>(null);
