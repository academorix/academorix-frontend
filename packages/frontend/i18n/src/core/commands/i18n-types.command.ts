/**
 * @file i18n-types.command.ts
 * @module @stackra/i18n/commands
 * @description CLI command to generate TypeScript type definitions from translation files.
 */

import { generateI18nTypes } from '../utils/type-generator.util';

/**
 * Generate i18n TypeScript types.
 *
 * Reads translation JSON files from the configured path and produces
 * a `.d.ts` file with typed keys for IDE autocomplete.
 *
 * @param translationsPath - Path to the translations directory
 * @param outputPath - Path for the generated .d.ts file
 */
export function runTypesCommand(translationsPath: string, outputPath: string): void {
  try {
    const written = generateI18nTypes({ translationsPath, outputPath });

    if (written) {
      console.log(`[i18n:types] Generated: ${outputPath}`);
    } else {
      console.log(`[i18n:types] No changes detected.`);
    }
  } catch (error: any) {
    console.error(`[i18n:types] Error: ${error.message}`);
    process.exit(1);
  }
}
