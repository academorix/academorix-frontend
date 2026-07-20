/**
 * @file i18n-plugin.ts
 * @module @stackra/i18n/vite
 * @description Vite plugin for auto-discovering translation files and exposing
 *   them as a virtual module. Provides HMR for translation changes.
 *
 *   ## Virtual Modules
 *
 *   - `virtual:i18n/translations` — exports `{ translations, supportedLocales }`
 *
 *   ## Usage
 *
 *   ```typescript
 *   // vite.config.ts
 *   import { i18nPlugin } from '@stackra/i18n/vite';
 *
 *   export default defineConfig({
 *     plugins: [i18nPlugin({ translationsDir: './src/i18n' })],
 *   });
 *   ```
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, resolve, basename } from 'path';

import type { I18nPluginOptions } from './interfaces';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Plugin
// ============================================================================

const VIRTUAL_MODULE_ID = 'virtual:i18n/translations';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_MODULE_ID;

/**
 * Vite plugin that auto-discovers translation files and exposes them
 * as a virtual module for zero-config i18n loading.
 *
 * @param options - Plugin configuration
 * @returns Vite plugin object
 */
export function i18nPlugin(options: I18nPluginOptions): any {
  const ext = options.fileExtension ?? '.json';
  let root = '';

  return {
    name: 'stackra-i18n',
    enforce: 'pre' as const,

    configResolved(config: any) {
      root = config.root;
    },

    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },

    load(id: string) {
      if (id !== RESOLVED_VIRTUAL_ID) return null;

      const translationsDir = resolve(root, options.translationsDir);

      if (!existsSync(translationsDir)) {
        return `export const translations = {};\nexport const supportedLocales = [];`;
      }

      const locales = readdirSync(translationsDir).filter((entry) =>
        statSync(join(translationsDir, entry)).isDirectory()
      );

      const translationsObj: Record<string, Record<string, unknown>> = {};

      for (const locale of locales) {
        const localeDir = join(translationsDir, locale);
        const files = readdirSync(localeDir).filter((f) => f.endsWith(ext));

        translationsObj[locale] = {};
        for (const file of files) {
          const namespace = basename(file, ext);
          const content = readFileSync(join(localeDir, file), 'utf-8');
          translationsObj[locale]![namespace] = JSON.parse(content);
        }
      }

      return [
        `export const translations = ${JSON.stringify(translationsObj)};`,
        `export const supportedLocales = ${JSON.stringify(locales)};`,
      ].join('\n');
    },

    handleHotUpdate(ctx: any) {
      const translationsDir = resolve(root, options.translationsDir);
      if (ctx.file.startsWith(translationsDir)) {
        const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
        if (mod) {
          ctx.server.moduleGraph.invalidateModule(mod);
          return [mod];
        }
      }
      return undefined;
    },
  };
}
