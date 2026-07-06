/**
 * @file eslint.config.mjs
 * @description ESLint flat config for @academorix/pwa. Extends the workspace
 * base config; no React runtime (build-time-only utilities).
 */

import baseConfig from "@academorix/eslint-config";

export default [...baseConfig];
