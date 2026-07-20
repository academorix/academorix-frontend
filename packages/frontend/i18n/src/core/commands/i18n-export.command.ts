/**
 * @file i18n-export.command.ts
 * @module @stackra/i18n/commands
 * @description CLI command to export translations for external translation services.
 *   Exports to flat JSON or CSV format suitable for translators.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from "fs";
import { join, basename } from "path";

import type { ExportFormat } from "../types";

/**
 * Export translations to a flat format for external translators.
 *
 * @param translationsPath - Path to the translations directory
 * @param outputDir - Output directory for exported files
 * @param format - Export format (json or csv)
 * @param sourceLocale - The source locale to export (default: first directory)
 */
export function exportTranslations(
  translationsPath: string,
  outputDir: string,
  format: ExportFormat = "json",
  sourceLocale?: string,
): void {
  if (!existsSync(translationsPath)) {
    throw new Error(`Translations path not found: ${translationsPath}`);
  }

  const localeDirs = readdirSync(translationsPath).filter((entry) =>
    statSync(join(translationsPath, entry)).isDirectory(),
  );

  const source = sourceLocale ?? localeDirs[0]!;
  const sourceDir = join(translationsPath, source);

  // Collect flat key-value pairs
  const flatEntries: Record<string, string> = {};
  const files = readdirSync(sourceDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const namespace = basename(file, ".json");
    const content = JSON.parse(readFileSync(join(sourceDir, file), "utf-8"));
    flattenEntries(content, `${namespace}.`, flatEntries);
  }

  // Write output
  mkdirSync(outputDir, { recursive: true });

  if (format === "json") {
    const outputPath = join(outputDir, `${source}-export.json`);
    writeFileSync(outputPath, JSON.stringify(flatEntries, null, 2), "utf-8");
    console.log(`[i18n:export] Exported ${Object.keys(flatEntries).length} keys to ${outputPath}`);
  } else {
    const outputPath = join(outputDir, `${source}-export.csv`);
    const lines = ["key,value"];
    for (const [key, value] of Object.entries(flatEntries)) {
      lines.push(`"${key}","${value.replace(/"/g, '""')}"`);
    }
    writeFileSync(outputPath, lines.join("\n"), "utf-8");
    console.log(`[i18n:export] Exported ${Object.keys(flatEntries).length} keys to ${outputPath}`);
  }
}

/**
 * Flatten nested object to dot-separated key-value pairs.
 */
function flattenEntries(
  obj: Record<string, unknown>,
  prefix: string,
  result: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = `${prefix}${key}`;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      flattenEntries(value as Record<string, unknown>, `${fullKey}.`, result);
    } else {
      result[fullKey] = String(value ?? "");
    }
  }
}
