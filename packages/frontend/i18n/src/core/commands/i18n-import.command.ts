/**
 * @file i18n-import.command.ts
 * @module @stackra/i18n/commands
 * @description CLI command to import translated files back into the project.
 *   Reads flat JSON/CSV and writes back to the structured locale directories.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Import flat translations into the locale directory structure.
 *
 * @param inputFile - Path to the flat JSON file (key → value pairs)
 * @param translationsPath - Path to the translations directory
 * @param targetLocale - Target locale code (e.g., "ar")
 */
export function importTranslations(
  inputFile: string,
  translationsPath: string,
  targetLocale: string,
): void {
  if (!existsSync(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  const content = readFileSync(inputFile, "utf-8");
  const flat: Record<string, string> = JSON.parse(content);

  // Group by namespace (first segment of dot-separated key)
  const namespaced: Record<string, Record<string, unknown>> = {};

  for (const [key, value] of Object.entries(flat)) {
    const dotIdx = key.indexOf(".");
    if (dotIdx === -1) continue;

    const namespace = key.slice(0, dotIdx);
    const restKey = key.slice(dotIdx + 1);

    if (!namespaced[namespace]) namespaced[namespace] = {};
    setNestedValue(namespaced[namespace]!, restKey, value);
  }

  // Write each namespace to its JSON file
  const localeDir = join(translationsPath, targetLocale);
  mkdirSync(localeDir, { recursive: true });

  let totalKeys = 0;
  for (const [namespace, data] of Object.entries(namespaced)) {
    const filePath = join(localeDir, `${namespace}.json`);
    writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    totalKeys += Object.keys(flat).filter((k) => k.startsWith(`${namespace}.`)).length;
  }

  console.log(
    `[i18n:import] Imported ${totalKeys} keys into ${targetLocale}/ (${Object.keys(namespaced).length} files)`,
  );
}

/**
 * Set a value at a nested dot-separated path in an object.
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split(".");
  let current: any = obj;

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]!;
    if (!current[seg] || typeof current[seg] !== "object") {
      current[seg] = {};
    }
    current = current[seg];
  }

  current[segments[segments.length - 1]!] = value;
}
