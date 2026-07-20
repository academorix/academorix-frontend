/**
 * @file vitest.setup.ts
 * @module @stackra/collaboration/test-setup
 * @description Vitest setup for @stackra/collaboration.
 *
 *   Imports the shared monorepo setup (`@stackra/testing/setup`) so
 *   `vi.useFakeTimers()`, spies, and stubbed globals are restored
 *   between tests — timer-heavy specs (heartbeat / stale peer
 *   cleanup) must not leak into their neighbours.
 */

import '@stackra/testing/setup';
