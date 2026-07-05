/**
 * @file eslint.config.mjs
 * @description
 * ESLint flat config for `@academorix/landing-page`.
 *
 * Composes the workspace's shared React config
 * (`@academorix/eslint-config/react`) with `@next/eslint-plugin-next` in
 * flat form. We deliberately use `@next/eslint-plugin-next` directly rather
 * than `eslint-config-next` because the meta-package re-registers plugins
 * (`import`, `react`) that our shared base config already registers, which
 * flat-config rejects. The plugin's own flat configs cover the Next-specific
 * rules we care about (Core Web Vitals, script-src warnings, html-link-for-pages).
 */

import react from "@academorix/eslint-config/react";
import next from "@next/eslint-plugin-next";

export default [
  {
    ignores: [".next/**", "next-env.d.ts", "public/**", ".turbo/**"],
  },
  ...react,
  {
    plugins: {
      "@next/next": next,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    },
  },
];
