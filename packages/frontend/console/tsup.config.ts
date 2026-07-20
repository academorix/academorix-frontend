/**
 * @file tsup.config.ts
 * @module @stackra/console/build
 * @description Bundler configuration for `@stackra/console`. Emits three
 *   publishable entries (`index`, `publishing`, `testing`) as dual
 *   ESM+CJS+DTS bundles via the workspace-wide `defineBaseConfig`.
 *
 *   The `bin/stackra` CLI executable is NOT bundled — it stays as a
 *   plain script in the published `files: ["bin", …]` array and
 *   resolves its imports through the built `dist/index.js` at runtime.
 */

import { defineBaseConfig } from "@academorix/config-tsup";

export default defineBaseConfig({
  index: "src/index.ts",
  publishing: "src/publishing/index.ts",
  testing: "src/testing/index.ts",
});
