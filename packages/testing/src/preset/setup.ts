/**
 * @file setup.ts
 * @module @stackra/testing/setup
 * @description Global afterEach cleanup hook used as a Vitest setup file
 *   across the monorepo. Imported via
 *   `setupFiles: ['./__tests__/vitest.setup.ts']` and re-exported as
 *   `import '@stackra/testing/setup'`.
 *
 *   Restores all `vi.useFakeTimers()`, `vi.spyOn`, and time-frozen state
 *   between tests so individual cases stay isolated.
 */

import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
