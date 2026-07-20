/**
 * @file vitest.setup.ts
 * @module @stackra/config/test
 * @description Vitest setup — pulls in `@stackra/testing/setup` for
 *   the shared assertion helpers and `reflect-metadata` for the DI
 *   decorators emitted by SWC.
 */

import "@stackra/testing/setup";
import "reflect-metadata";
