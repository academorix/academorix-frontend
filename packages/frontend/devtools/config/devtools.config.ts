/**
 * @file devtools.config.ts
 * @module @stackra/devtools/config
 * @description Application-level devtools panel configuration.
 *   Consumed by `DevtoolsModule.forRoot()` at bootstrap.
 */

import { defineConfig } from "@stackra/devtools";

export const devtoolsConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Position
  |--------------------------------------------------------------------------
  |
  | Where the floating panel docks — `'right' | 'bottom' | 'left' | 'top'`.
  | The panel's UI shell is gated behind `import.meta.env.DEV`, so
  | keeping the module included in prod is safe.
  |
  */
  position: "right",

  /*
  |--------------------------------------------------------------------------
  | Initial Size
  |--------------------------------------------------------------------------
  |
  | Pixel size along the docked axis on first open. Resizes are
  | persisted per-user via `localStorage` after that.
  |
  */
  initialSize: 480,
});
