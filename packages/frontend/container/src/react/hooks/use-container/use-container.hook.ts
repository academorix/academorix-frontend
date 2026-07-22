/**
 * @file use-container.hook.ts
 * useContainer Hook
 *
 * Access the `ApplicationContext` from React context.
 *
 * @module hooks/use-container
 */

import { useContext } from "react";

import type { ApplicationContext } from "@/core/application/application-context.service";
import { ContainerContext } from "@/react/contexts/container";

/**
 * Get the application context from React context.
 *
 * Returns the `ApplicationContext` provided by `<ContainerProvider>`.
 * Useful when you need direct access to `get()`, `has()`, or `select()`.
 *
 * For most cases, prefer `useInject()` instead.
 *
 * @returns The `ApplicationContext` instance
 *
 * @throws Error if used outside of `<ContainerProvider>`
 *
 * @example
 * ```typescript
 * function DebugPanel() {
 *   const container = useContainer();
 *   const hasCache = container.has(CacheManager);
 *   return <div>Cache available: {String(hasCache)}</div>;
 * }
 * ```
 */
export function useContainer(): ApplicationContext {
  const context = useContext(ContainerContext);

  if (!context) {
    throw new Error(
      "useContainer() must be used within a <ContainerProvider>. " +
        "Wrap your component tree with <ContainerProvider context={app}>.",
    );
  }

  return context;
}
