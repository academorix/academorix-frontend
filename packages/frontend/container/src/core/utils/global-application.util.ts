/**
 * @file global-application.util.ts
 * @module @stackra/container/utils/global-application
 *
 * @description
 * Global ApplicationContext Singleton
 *
 * Stores the application context instance globally so it can be accessed
 * by `ContainerProvider` (without needing to pass it as a prop) and by
 * the `inject()` lazy proxy.
 *
 * This pattern allows you to:
 * 1. Create the app once in `main.ts`
 * 2. Use `<ContainerProvider>` without props
 * 3. Access the container anywhere via `useContainer()` or `inject()`
 *
 * Mirrors NestJS's internal singleton pattern but adapted for client-side
 * where there's always exactly one application per page.
 *
 * ## Why we pin the slot to `globalThis`
 *
 * `@stackra/container` publishes several tsup entrypoints
 * (`index`, `react`, `testing`). Because `tsup` builds each entry as
 * an independent bundle with `splitting: false`, this file gets
 * inlined into every emitted bundle — one physical copy per
 * entrypoint. If the "singleton" lived in a module-scope `let`, each
 * bundle would own its own separate copy and they would never see
 * each other:
 *
 *   * `main.tsx` imports `ApplicationFactory` from `@stackra/container`
 *     → sets the `let` inside `dist/index.mjs`.
 *   * `main.tsx` imports `ContainerProvider` from
 *     `@stackra/container/react` → reads the `let` inside
 *     `dist/react.mjs`, still `undefined`. Boot fails with
 *     "No container context found".
 *
 * Storing the ref on `globalThis` under a `Symbol.for(...)` key
 * dodges the bundle-duplication trap — every inlined copy still
 * reaches the same slot, since `globalThis` is one object per
 * realm and `Symbol.for(...)` is one registry per process. This is
 * the same pattern React DevTools / TanStack Query / Zustand use.
 */

import type { ApplicationContext } from "@/core/application/application-context.service";

/** Simple internal logger — foundation layer cannot depend on @stackra/logger (core layer). */
const logger = {
  warn(message: string): void {
    console.warn(`[GlobalApplication] ${message}`);
  },
};

/**
 * Cross-realm registry key for the singleton slot on `globalThis`.
 * `Symbol.for(...)` returns the same symbol across every bundle
 * that runs in the same process, which is what makes the slot
 * survive tsup's per-entry bundle duplication.
 */
const GLOBAL_APPLICATION_CONTEXT_KEY = Symbol.for("@stackra/container:global-application-context");

/**
 * Structural view of the singleton slot on `globalThis`. Kept
 * private so downstream callers cannot reach it directly — they
 * must go through the exported getter/setter.
 */
interface GlobalSlot {
  [GLOBAL_APPLICATION_CONTEXT_KEY]?: ApplicationContext;
}

/**
 * The one `globalThis` object cast to expose the singleton slot.
 * Every inlined copy of this file resolves the same object, so
 * every copy reads + writes the same slot.
 */
const slot = globalThis as unknown as GlobalSlot;

/**
 * Set the global application context instance.
 *
 * Called automatically by `ApplicationFactory.create()`. You should not
 * need to call this manually in production code.
 *
 * @param context - The application context to set globally
 *
 * @internal
 */
export function setGlobalApplicationContext(context: ApplicationContext): void {
  if (slot[GLOBAL_APPLICATION_CONTEXT_KEY]) {
    logger.warn(
      "Global application context already exists. " +
        "Creating multiple contexts is not recommended. " +
        "The new context will replace the existing one.",
    );
  }
  slot[GLOBAL_APPLICATION_CONTEXT_KEY] = context;
}

/**
 * Get the global application context instance.
 *
 * Returns the context created by `ApplicationFactory.create()`.
 * Used internally by `ContainerProvider` and `inject()`.
 *
 * @returns The global application context, or `undefined` if not created yet
 *
 * @internal
 */
export function getGlobalApplicationContext(): ApplicationContext | undefined {
  return slot[GLOBAL_APPLICATION_CONTEXT_KEY];
}

/**
 * Clear the global application context instance.
 *
 * Useful for testing or when you need to recreate the application.
 * After calling this, `getGlobalApplicationContext()` returns `undefined`
 * until `ApplicationFactory.create()` is called again.
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   clearGlobalApplicationContext();
 * });
 * ```
 */
export function clearGlobalApplicationContext(): void {
  slot[GLOBAL_APPLICATION_CONTEXT_KEY] = undefined;
}

/**
 * Check if a global application context exists.
 *
 * @returns `true` if a global context has been created
 *
 * @example
 * ```typescript
 * if (hasGlobalApplicationContext()) {
 *   const app = getGlobalApplicationContext()!;
 *   app.get(SomeService);
 * }
 * ```
 */
export function hasGlobalApplicationContext(): boolean {
  return slot[GLOBAL_APPLICATION_CONTEXT_KEY] !== undefined;
}
