/**
 * @file index.ts
 * @module @stackra/i18n/vite
 * @description Vite plugin subpath — auto-discovers translation files at
 *   build time and exposes them as `virtual:i18n/translations`.
 *
 *   The virtual module's ambient type declaration is shipped from the
 *   sibling `client.d.ts` file. Consumers add a single triple-slash
 *   reference to their `vite-env.d.ts`:
 *
 *   ```ts
 *   /// <reference types="@stackra/i18n/vite/client" />
 *   ```
 */

export { i18nPlugin } from "./i18n-plugin";
export type { I18nPluginOptions } from "./interfaces";
export { generateI18nTypes } from "../core/utils/type-generator.util";
export type { TypeGeneratorOptions } from "../core/interfaces";
