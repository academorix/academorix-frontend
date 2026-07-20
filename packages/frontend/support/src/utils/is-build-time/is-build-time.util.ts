/**
 * @file is-build-time.util.ts
 * @module @stackra/support/utils/is-build-time
 * @description Detect whether we are running inside the framework's
 *   build-time execution context. Modules that touch browser APIs
 *   (`window`, IndexedDB, BroadcastChannel, ...) guard against this
 *   flag to register no-op / mock providers during prerender.
 *
 *   The routing Vite plugin sets `STACKRA_PLATFORM=build` before
 *   invoking `ApplicationFactory.create(AppModule)` — the flag is
 *   consumed via `Env.get(...)` so the check works uniformly in
 *   Node + Vite + browser contexts.
 */

import { Env } from "../../env";

/**
 * Return `true` when we are in the framework's build-time context
 * (i.e. `STACKRA_PLATFORM=build`).
 *
 * @returns `true` at build time; `false` at runtime.
 *
 * @example
 * ```typescript
 * import { isBuildTime } from '@stackra/support';
 *
 * if (isBuildTime()) {
 *   // Register a no-op / mock provider for the prerender walk.
 *   return { module: MyModule, providers: [{ provide: MY_SERVICE, useValue: nullMock }] };
 * }
 * ```
 */
export function isBuildTime(): boolean {
  // Consume STACKRA_PLATFORM through the `Env` façade so the check
  // reads consistently across Node + Vite + injected `__ENV__`.
  return Env.get("STACKRA_PLATFORM") === "build";
}
