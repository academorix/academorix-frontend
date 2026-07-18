/**
 * @file use-stackra-routing-context.hook.ts
 * @module @stackra/routing/react/hooks/use-stackra-routing-context
 * @description Read the `<StackraRoutingProvider>` context.
 *
 *   Throws when called outside the provider (per PLAN v3.12.3) so
 *   misconfigurations surface as clear, actionable errors instead of
 *   `Cannot read property 'router' of null`.
 */

import { useContext } from "react";

import { StackraRoutingContext } from "@/react/contexts";
import type { IStackraRoutingContext } from "@/react/contexts";

/**
 * Reach the routing provider's context.
 *
 * @returns The context value — DI container + config + RRv7 router.
 * @throws {Error} When called outside `<StackraRoutingProvider>`.
 *
 * @example
 * ```typescript
 * import { useStackraRoutingContext } from '@stackra/routing/react';
 *
 * function MyComponent() {
 *   const { container, router } = useStackraRoutingContext();
 *   // ...
 * }
 * ```
 */
export function useStackraRoutingContext(): IStackraRoutingContext {
  const context = useContext(StackraRoutingContext);
  // Per PLAN v3.12.3 — clear message + names the two providers so
  // remediation is one grep away.
  if (context === null) {
    throw new Error(
      "useStackraRoutingContext() called outside <StackraRoutingProvider>. " +
        "Mount your React tree under <ContainerProvider> and " +
        "<StackraRoutingProvider> before using routing hooks.",
    );
  }
  return context;
}
