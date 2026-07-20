/**
 * @file scope.config.ts
 * @module @stackra/scope/config
 * @description Application-level scope configuration.
 *   Copy into your app's `src/config/` and import into your AppModule.
 */

import { defineConfig } from "@stackra/scope";

export const scopeConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Cache
  |--------------------------------------------------------------------------
  |
  | Client-side hints for caching resolved cascading values.
  |
  */
  cache: { enabled: true, ttl: 300, memorySize: 1000 },

  /*
  |--------------------------------------------------------------------------
  | Resolution
  |--------------------------------------------------------------------------
  |
  | Guards honoured by the backend resolver (max hierarchy depth + timeout).
  |
  */
  resolution: { maxDepth: 10, timeoutMs: 2000 },
});
