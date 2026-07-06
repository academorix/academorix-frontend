/**
 * @file use-scope.ts
 * @module lib/scope/use-scope
 *
 * @description
 * Hook for reading and mutating the active working scope (organization / branch
 * / season). Must be used within a {@link "@/lib/scope/scope-context".ScopeProvider}.
 */

import { useContext } from "react";

import type { ScopeContextValue } from "@/lib/scope/scope.types";

import { ScopeContext } from "@/lib/scope/scope-context";

/**
 * Returns the active scope, its setters, the resolved option objects, and the
 * caller's allowed scopes.
 *
 * @throws If called outside a {@link ScopeProvider}.
 */
export function useScope(): ScopeContextValue {
  const context = useContext(ScopeContext);

  if (!context) {
    throw new Error("useScope must be used within a ScopeProvider.");
  }

  return context;
}
