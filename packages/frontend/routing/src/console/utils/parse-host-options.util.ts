/**
 * @file parse-host-options.util.ts
 * @module @stackra/routing/console/utils
 * @description Minimal argv parser for `stackra host` — recognises
 *   `--remove`, `--dry-run`, `--rootDomain <domain>`, and the
 *   `--rootDomain=<domain>` inline form.
 *
 *   No dependency on `commander` / `yargs` — the option surface is tiny
 *   and this way `@stackra/console`'s framework-level argv parser can
 *   still delegate here if it wants a strict typed result.
 */

import { Str } from "@stackra/support";

import type { IHostOptions } from "../interfaces";

/**
 * Parse argv tokens (after the command name) into an `IHostOptions` bag.
 *
 * @param argv - Args slice that follows the `host` command name.
 * @returns Normalised options — all flags default to `false` and
 *   `rootDomain` is `undefined` when not provided.
 */
export function parseHostOptions(argv: readonly string[]): IHostOptions {
  let remove = false;
  let dryRun = false;
  let rootDomain: string | undefined;

  // Walk argv once — recognise flag tokens; capture the following
  // token as `--rootDomain`'s value when it uses the space form.
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    // Loop bound guarantees `argv[i]` is defined, but `noUncheckedIndexedAccess`
    // widens the lookup to `string | undefined` — guard once so TS narrows.
    if (token === undefined) continue;

    if (token === "--remove") {
      remove = true;
      continue;
    }
    if (token === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (token === "--rootDomain") {
      // Space form: `--rootDomain stackra.app`
      rootDomain = argv[i + 1];
      i += 1;
      continue;
    }
    if (Str.startsWith(token, "--rootDomain=")) {
      // Inline form: `--rootDomain=stackra.app`
      rootDomain = token.slice("--rootDomain=".length);
      continue;
    }
  }

  return { remove, dryRun, rootDomain };
}
