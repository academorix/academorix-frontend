/**
 * @file default-parser.util.ts
 * @module @stackra/config/core/utils
 * @description Returns the default env-file parser (`dotenv.parse`)
 *   when running under Node.js. Throws `ConfigError` in the browser.
 *
 *   Kept as a lazy dynamic import so `packages/config/dist/index.mjs`
 *   does not statically reference `dotenv` — a browser bundler that
 *   tree-shakes this branch away drops the entire dep.
 *
 * @derived @nestjs/config@4.0.4 — lib/utils/get-default-parser.util.ts (MIT, © Kamil Myśliwiec)
 */

import type { Parser } from "@stackra/contracts";

import { ConfigError } from "../errors";
import { isNode } from "./is-node.util";

/**
 * Produce the default env-file parser.
 *
 * In Node.js runtimes, returns a `Parser` that wraps `dotenv.parse`.
 * In browser runtimes, returns a parser that throws — the caller
 * should never reach the parser in a browser build (env files aren't
 * loaded there), but the defensive throw catches mis-configured code
 * paths early.
 *
 * @returns A `Parser` matching the `@stackra/contracts` shape.
 *
 * @example
 * ```typescript
 * const parser = await getDefaultParser();
 * const record = parser('KEY=value\nOTHER=42');
 * ```
 */
export async function getDefaultParser(): Promise<Parser> {
  if (!isNode()) {
    // Return a parser that throws — the caller shouldn't be reaching
    // this in a browser build, but we defend the fail-soft path.
    return () => {
      throw new ConfigError(
        "No parser available in browser runtime — env files are only loaded under Node.js.",
        "CONFIG_ERROR",
      );
    };
  }
  // Dynamic import so the bundler doesn't statically pull `dotenv`
  // into the browser build. `packages/config/tsup.config.ts` also
  // marks `dotenv` as external for good measure.
  const dotenv = await import("dotenv");
  return dotenv.parse as Parser;
}
