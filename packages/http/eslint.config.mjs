/**
 * @file eslint.config.mjs
 * @description ESLint flat config for @academorix/http. Extends the workspace
 * base config; no React runtime here (framework-agnostic HTTP layer).
 */

import baseConfig from "@academorix/eslint-config";

export default [...baseConfig];
