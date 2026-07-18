/**
 * @file vitest.config.ts
 * @module @stackra/sync/test
 * @description Vitest configuration for @stackra/sync.
 *
 *   Extends the shared monorepo preset from `@stackra/testing/preset`.
 *   Only package-specific overrides belong in this file.
 */

import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'node:path';
import preset from '@stackra/testing/preset';

export default mergeConfig(
  preset,
  defineConfig({
    // Explicitly re-declare to survive mergeConfig — vitest 4's default OXC
    // transformer breaks decorator metadata emission.
    oxc: false,
    esbuild: false,
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
