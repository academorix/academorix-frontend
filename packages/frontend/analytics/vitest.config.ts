/**
 * @file vitest.config.ts
 * @module @stackra/analytics/test
 * @description Vitest configuration for @stackra/analytics.
 */

import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'node:path';
import preset from '@stackra/testing/preset';

export default mergeConfig(
  preset,
  defineConfig({
    oxc: false,
    esbuild: false,
    test: {
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  })
);
