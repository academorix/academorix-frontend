/**
 * @file page-progress.context.ts
 * @module @stackra/ui/react/contexts/page-progress
 * @description React context for the page-level progress bar (NProgress-style).
 */

import { createContext } from "react";

// Relative import — same rationale as the sibling context file.
import type { IPageProgressContextValue } from "../../providers/page-progress/page-progress.interface";

/**
 * PageProgress context — provides start/done/isAnimating controls
 * for the top-of-viewport loading bar.
 */
export const PageProgressContext = createContext<IPageProgressContextValue | null>(null);
