/**
 * @file vitest.config.ts
 * @module @stackra/pwa/test
 * @description Vitest configuration for @stackra/pwa. Merges with
 *   `@stackra/testing/preset` for the SWC-backed transformer (which
 *   correctly emits `design:paramtypes` for DI classes referenced
 *   before their declaration).
 */

import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'node:path';
import preset from '@stackra/testing/preset';

export default mergeConfig(
  preset,
  defineConfig({
    // Disable Vitest 4's default OXC + esbuild transformers so SWC is
    // the sole transform — matches every other workspace package.
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
