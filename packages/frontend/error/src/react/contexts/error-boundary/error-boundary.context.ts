/**
 * @file error-boundary.context.ts
 * @module @stackra/error/react/contexts/error-boundary
 * @description React context published by an `ErrorBoundary` to its
 *   fallback subtree — carries the caught error + a reset handle.
 */

import { createContext } from "react";

import type { ErrorBoundaryContextValue } from "./error-boundary.interface";

/**
 * Context populated by `ErrorBoundary` while it is showing a fallback.
 *
 * `null` outside of a boundary's fallback subtree.
 */
export const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);

ErrorBoundaryContext.displayName = "ErrorBoundaryContext";
