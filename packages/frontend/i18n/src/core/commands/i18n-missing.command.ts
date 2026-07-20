/**
 * @file i18n-missing.command.ts
 * @module @stackra/i18n/commands
 * @description CLI command to find missing translation keys across locales.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, basename } from "path";

import type { MissingKeysReport } from "../interfaces";

/**
 * Find translation keys that are present in the source locale but missing in others.
 *
 * @param translationsPath - Path to the translations directory
 * @param sourceLocale - The reference locale (default: first directory)
 * @returns Array of reports per locale
 */
export function findMissingKeys(
  translationsPath: string,
  sourceLocale?: string,
): MissingKeysReport[] {
  if (!existsSync(translationsPath)) {
    throw new Error(`Translations path not found: ${translationsPath}`);
  }

  const localeDirs = readdirSync(translationsPath).filter((entry) =>
    statSync(join(translationsPath, entry)).isDirectory(),
  );

  if (localeDirs.length < 2) return [];

  const source = sourceLocale ?? localeDirs[0]!;
  const sourceKeys = collectAllKeys(join(translationsPath, source));

  const reports: MissingKeysReport[] = [];

  for (const locale of localeDirs) {
    if (locale === source) continue;

    const localeKeys = collectAllKeys(join(translationsPath, locale));
    const missing = sourceKeys.filter((key) => !localeKeys.includes(key));

    reports.push({
      locale,
      missingKeys: missing,
      count: missing.length,
    });
  }

  return reports;
}

/**
 * Collect all flat dot-separated keys from JSON files in a directory.
 */
function collectAllKeys(dir: string): string[] {
  const keys: string[] = [];

  if (!existsSync(dir)) return keys;

  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const namespace = basename(file, ".json");
    const content = JSON.parse(readFileSync(join(dir, file), "utf-8"));
    flattenKeys(content, `${namespace}.`, keys);
  }

  return keys;
}

/**
 * Recursively flatten nested object keys into dot-separated paths.
 */
function flattenKeys(obj: Record<string, unknown>, prefix: string, result: string[]): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = `${prefix}${key}`;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      flattenKeys(value as Record<string, unknown>, `${fullKey}.`, result);
    } else {
      result.push(fullKey);
    }
  }
}

/**
 * CLI runner for the missing keys command.
 */
export function runMissingCommand(translationsPath: string, sourceLocale?: string): void {
  try {
    const reports = findMissingKeys(translationsPath, sourceLocale);

    if (reports.length === 0) {
      console.log("[i18n:missing] All locales are in sync.");
      return;
    }

    let totalMissing = 0;
    for (const report of reports) {
      if (report.count > 0) {
        console.log(`\n[${report.locale}] ${report.count} missing key(s):`);
        for (const key of report.missingKeys.slice(0, 50)) {
          console.log(`  - ${key}`);
        }
        if (report.count > 50) {
          console.log(`  ... and ${report.count - 50} more.`);
        }
        totalMissing += report.count;
      }
    }

    console.log(
      `\nTotal missing: ${totalMissing} key(s) across ${reports.filter((r) => r.count > 0).length} locale(s).`,
    );
  } catch (error: any) {
    console.error(`[i18n:missing] Error: ${error.message}`);
    process.exit(1);
  }
}
