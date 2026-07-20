/**
 * @file host-render-block.util.ts
 * @module @stackra/routing/console/utils
 * @description Pure renderer — turns a `(rootDomain, subdomains)` tuple into
 *   the exact string that `stackra host` writes between the BEGIN / END
 *   markers.
 */

import { HOST_BLOCK_BEGIN, HOST_BLOCK_END } from "../constants";

/**
 * Render the block of `/etc/hosts` lines for one root domain + N subdomains.
 *
 * The apex and `www` are always emitted so the base domain reaches the
 * dev server too. Every additional subdomain gets its own line, tab-
 * separated `127.0.0.1<TAB><host>`.
 *
 * @param rootDomain - Root domain (e.g. `"academorix.app"`).
 * @param subdomains - Subdomains to register (e.g. `["admin", "tenant-alpha"]`).
 * @returns The full block, including BEGIN / END markers.
 */
export function renderHostBlock(rootDomain: string, subdomains: readonly string[]): string {
  const lines: string[] = [HOST_BLOCK_BEGIN];

  // Apex + www + every requested subdomain; empty prefix ("") emits
  // the apex line (`rootDomain` on its own).
  const allPrefixes = ["", "www", ...subdomains];
  for (const prefix of allPrefixes) {
    const host = prefix ? `${prefix}.${rootDomain}` : rootDomain;
    lines.push(`127.0.0.1\t${host}`);
  }

  lines.push(HOST_BLOCK_END);
  return lines.join("\n");
}
