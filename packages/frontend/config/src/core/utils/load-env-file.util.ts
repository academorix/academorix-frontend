/**
 * @file load-env-file.util.ts
 * @module @stackra/config/core/utils
 * @description Reads env files (`.env`) from disk and parses them.
 *
 *   Node-only — every filesystem interaction is guarded behind
 *   `isNode()` + dynamic `import('node:fs')`. The browser never
 *   reaches this path (Vite handles env files at build time).
 *
 * @derived @nestjs/config@4.0.4 — lib/config.module.ts (loadEnvFile static method) (MIT, © Kamil Myśliwiec)
 */

import type { Parser } from "@stackra/contracts";

import { ConfigError } from "../errors";
import { isNode } from "./is-node.util";

/**
 * Load one or more env files and merge the results into a flat record.
 *
 * @param envFilePaths - Absolute paths to env files. Missing files are
 *   silently skipped — nestjs's behaviour so a fresh clone doesn't
 *   crash before the developer supplies `.env`.
 * @param parser - Parser used to turn each file's contents into a
 *   flat record.
 * @param options - Optional expansion options passed to
 *   `dotenv-expand`.
 * @returns Merged flat env record. Later files in the list DO NOT
 *   override earlier ones (matches nestjs's `Object.assign(later, earlier)`
 *   order).
 * @throws {ConfigError} When invoked in a browser runtime.
 *
 * @example
 * ```typescript
 * const record = await loadEnvFile(['/app/.env'], parser);
 * ```
 */
export async function loadEnvFile(
  envFilePaths: string[],
  parser: Parser,
  options?: { expandVariables?: boolean | Record<string, unknown> },
): Promise<Record<string, unknown>> {
  // Defensive check — every caller already guards behind `isNode()`,
  // but throwing here provides a clear error if a browser codepath
  // ever reaches this function accidentally.
  if (!isNode()) {
    throw new ConfigError(
      "loadEnvFile can only be called under Node.js — the browser does not have filesystem access.",
      "CONFIG_ERROR",
    );
  }
  // Dynamic imports so the browser bundler drops these completely
  // when tree-shaking the caller. `node:fs` is listed as an external
  // in `tsup.config.ts` for defense in depth.
  const fs = await import("node:fs");
  let config: Record<string, unknown> = {};
  for (const envFilePath of envFilePaths) {
    // Skip missing files silently — matches nestjs. Fresh clones
    // without a `.env` shouldn't crash before the developer copies
    // one in.
    if (!fs.existsSync(envFilePath)) continue;
    const buffer = fs.readFileSync(envFilePath);
    const parsed = parser(buffer);
    // `Object.assign(next, prev)` order: EARLIER file's values win
    // on conflict. Matches nestjs.
    config = Object.assign(parsed, config);
    if (options?.expandVariables) {
      // Only import `dotenv-expand` when the caller actually opted in,
      // for the same tree-shaking reason as the `fs` import above.
      const { expand } = await import("dotenv-expand");
      const expandOptions =
        typeof options.expandVariables === "object" ? options.expandVariables : {};
      // dotenv-expand mutates `parsed` on the passed object; guard
      // against an undefined return by falling back to the current
      // record.
      const result = expand({ ...expandOptions, parsed: config as Record<string, string> });
      config = (result.parsed ?? config) as Record<string, unknown>;
    }
  }
  return config;
}
