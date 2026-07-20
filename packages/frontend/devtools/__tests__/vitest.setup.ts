/**
 * @file vitest.setup.ts
 * @module @stackra/devtools/test
 * @description Vitest setup — imports `reflect-metadata` so the DI
 *   container can read `design:paramtypes` in tests, matching the
 *   production runtime.
 */

import "reflect-metadata";
