/**
 * @file mock-prerender-context.util.ts
 * @module @stackra/routing/testing
 * @description Test-only factory for `IPrerenderContext` (per PLAN
 *   F.3 scope — "testing additions").
 *
 *   The prerender context ships the DI container to `page.prerender`
 *   functions at build time. Tests that exercise a `page.prerender`
 *   in isolation want a lightweight mock container that returns
 *   `null` for most services + lets the caller pre-seed the ones the
 *   prerender needs (CMS, DB, feature flags).
 */

import type { IApplication, IPrerenderContext } from "@stackra/contracts";

import { createMockContainer } from "./create-mock-container.util";

/**
 * Overrides accepted by `createMockPrerenderContext`.
 */
export interface IMockPrerenderContextOverrides {
  /**
   * Optional DI container. When omitted, a mock container is created
   * where every unregistered token throws on `get(...)` and
   * `getOptional(...)` returns `undefined`.
   */
  readonly container?: IApplication;

  /**
   * Pre-registered providers keyed by their DI token. Only honoured
   * when {@link container} is `undefined` — passing both would let
   * the caller's container overrides silently override the seeds
   * without a clear precedence.
   */
  readonly providers?: readonly (readonly [unknown, unknown])[];
}

/**
 * Build a mock `IPrerenderContext` for tests.
 *
 * @param overrides - Optional container / seed providers.
 * @returns Mock prerender context implementing `IPrerenderContext`.
 *
 * @example
 * ```typescript
 * import { createMockPrerenderContext } from '@stackra/routing/testing';
 * import { CMS_SERVICE } from '@stackra/contracts';
 *
 * const ctx = createMockPrerenderContext({
 *   providers: [[CMS_SERVICE, fakeCms]],
 * });
 * const slugs = await page.prerender!(ctx);
 * ```
 */
export function createMockPrerenderContext(
  overrides: IMockPrerenderContextOverrides = {},
): IPrerenderContext {
  const container =
    overrides.container ?? (createMockContainer(overrides.providers) as unknown as IApplication);

  return { container };
}
