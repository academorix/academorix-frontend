/**
 * @file eslint.config.mjs
 * @description ESLint flat config for @academorix/feature-flags. Extends
 * the workspace React base config since this package ships React runtime.
 */

import reactConfig from "@academorix/eslint-config/react";

export default [...reactConfig];
