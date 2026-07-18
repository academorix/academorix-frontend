/**
 * @file use-page-progress.hook.ts
 * @module @stackra/ui/react/hooks/use-page-progress
 * @description Hook to consume the PageProgress context for triggering
 *   the NProgress-style loading bar from route changes or async operations.
 */

import { useContext } from "react";

import { PageProgressContext } from "../../contexts/page-progress";

import type { IPageProgressContextValue } from "../../providers/page-progress/page-progress.interface";

/**
 * Access the page progress bar controls.
 *
 * Must be called from within a `<PageProgressProvider>` tree.
 *
 * @returns Controls for starting, completing, and querying the progress bar.
 * @throws Error if called outside of PageProgressProvider.
 *
 * @example
 * ```tsx
 * const { start, done, isAnimating } = usePageProgress();
 *
 * // On route change:
 * useEffect(() => { start(); return () => done(); }, [pathname]);
 *
 * // On async operation:
 * const handleSubmit = async () => {
 *   start();
 *   await saveData();
 *   done();
 * };
 * ```
 */
export function usePageProgress(): IPageProgressContextValue {
  const ctx = useContext(PageProgressContext);

  if (!ctx) {
    throw new Error("usePageProgress: must be used within a <PageProgressProvider>.");
  }

  return ctx;
}
