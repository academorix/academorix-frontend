/**
 * @file vitest.setup.ts
 * @module @stackra/notifications/__tests__
 * @description Vitest setup file — imports `reflect-metadata` so the
 *   DI container's decorator machinery works from the very first
 *   `Injectable()` in the suite.
 */

import "reflect-metadata";
