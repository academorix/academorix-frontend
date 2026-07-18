/**
 * @file vitest.config.ts
 * @module @stackra/theming/test
 * @description Vitest configuration for @stackra/theming.
 *
 *   Extends the shared monorepo preset from `@stackra/testing/preset`.
 *   Only package-specific overrides belong in this file.
 *
 *   The preset provides:
 *   - Globals enabled (`describe`, `it`, `expect` — no imports needed)
 *   - Coverage via @vitest/coverage-v8
 *   - DI container auto-reset between tests
 *   - Reasonable timeouts and retry defaults
 *
 *   The path alias `@/*` → `./src/*` mirrors tsconfig so tests can
 *   import internal modules without deep relative paths.
 */

import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'node:path';
import preset from '@stackra/testing/preset';

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      setupFiles: ['./__tests__/vitest.setup.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  })
);
