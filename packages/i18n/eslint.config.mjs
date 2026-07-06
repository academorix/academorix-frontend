/**
 * @file eslint.config.mjs
 * @description ESLint flat config for @academorix/i18n. Extends the workspace
 * React base config since this package ships React runtime (LocaleProvider,
 * useLocale).
 */

import reactConfig from "@academorix/eslint-config/react";

export default [...reactConfig];
