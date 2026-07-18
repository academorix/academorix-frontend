/**
 * @file page-progress.provider.tsx
 * @module @stackra/ui/react/providers/page-progress
 * @description NProgress-style page loading bar provider.
 *   Renders a thin animated ProgressBar at the top of the viewport.
 *   Controlled via `usePageProgress()` hook from any component.
 *   Uses HeroUI's ProgressBar component for consistent theming.
 */

"use client";

import { ProgressBar } from "@heroui/react";
import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";

// Relative import — the `@/*` tsconfig alias trips Vite's dev
// server when it walks the workspace source directly. Relative
// paths resolve identically in every tool.
import { PageProgressContext } from "../../contexts/page-progress";

import type {
  PageProgressProviderProps,
  IPageProgressContextValue,
} from "./page-progress.interface";

/**
 * Clamp a value between min and max.
 *
 * @param value - Value to clamp.
 * @param min - Minimum bound.
 * @param max - Maximum bound.
 * @returns Clamped value.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a random increment amount based on current progress.
 * Slower increments as progress gets higher (mimics real loading).
 *
 * @param progress - Current progress (0-100).
 * @returns Increment amount.
 */
function getIncrement(progress: number): number {
  if (progress < 20) return Math.random() * 10 + 3;
  if (progress < 50) return Math.random() * 5 + 2;
  if (progress < 80) return Math.random() * 3 + 1;
  if (progress < 95) return Math.random() * 1 + 0.5;

  return 0;
}

/**
 * PageProgressProvider — Renders the NProgress-style bar and provides context.
 *
 * Wrap your app (or layout) with this provider. Then use `usePageProgress()`
 * to call `start()` on navigation begin and `done()` on navigation end.
 *
 * @param props - Provider props.
 * @returns The provider with the progress bar element.
 *
 * @example
 * ```tsx
 * // In your root layout:
 * <PageProgressProvider color="var(--color-accent)" height={3}>
 *   <App />
 * </PageProgressProvider>
 *
 * // In your router integration:
 * const { start, done } = usePageProgress();
 * useEffect(() => {
 *   start();
 *   return () => done();
 * }, [pathname]);
 * ```
 */
export function PageProgressProvider({
  children,
  height = 3,
  minimum = 8,
  trickleSpeed = 200,
  zIndex = 9999,
}: PageProgressProviderProps): React.ReactElement {
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Stop the trickle interval. */
  const stopTrickle = useCallback(() => {
    if (trickleRef.current) {
      clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
  }, []);

  /** Start the trickle interval. */
  const startTrickle = useCallback(() => {
    stopTrickle();
    trickleRef.current = setInterval(() => {
      setProgress((prev) => {
        const inc = getIncrement(prev);

        return clamp(prev + inc, 0, 99.4);
      });
    }, trickleSpeed);
  }, [trickleSpeed, stopTrickle]);

  /** Start the progress bar. */
  const start = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setProgress(minimum);
    setIsAnimating(true);
    setIsVisible(true);
    startTrickle();
  }, [minimum, startTrickle]);

  /** Complete and hide the progress bar. */
  const done = useCallback(() => {
    stopTrickle();
    setProgress(100);
    setIsAnimating(false);

    // Hide after the completion transition finishes
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 300);
  }, [stopTrickle]);

  /** Increment progress by a random amount. */
  const increment = useCallback(() => {
    setProgress((prev) => {
      if (prev === 0) return minimum;
      const inc = getIncrement(prev);

      return clamp(prev + inc, 0, 99.4);
    });
  }, [minimum]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTrickle();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [stopTrickle]);

  const contextValue = useMemo<IPageProgressContextValue>(
    () => ({ start, done, increment, isAnimating, progress }),
    [start, done, increment, isAnimating, progress],
  );

  return (
    <PageProgressContext.Provider value={contextValue}>
      {/* Progress bar */}
      {isVisible && (
        <div
          className="pointer-events-none fixed top-0 right-0 left-0"
          data-component="page-progress"
          style={{ zIndex }}
        >
          <ProgressBar
            aria-label="Page loading"
            className={`transition-opacity duration-300 ${progress >= 100 ? "opacity-0" : "opacity-100"}`}
            color="accent"
            size="sm"
            value={progress}
          >
            <ProgressBar.Track
              className="bg-transparent"
              style={{ height: `${height}px` } as React.CSSProperties}
            >
              <ProgressBar.Fill className="transition-all duration-200 ease-out" />
            </ProgressBar.Track>
          </ProgressBar>
        </div>
      )}

      {children}
    </PageProgressContext.Provider>
  );
}

PageProgressProvider.displayName = "PageProgressProvider";
