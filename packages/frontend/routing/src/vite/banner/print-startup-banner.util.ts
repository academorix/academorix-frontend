/**
 * @file print-startup-banner.util.ts
 * @module @stackra/routing/vite/banner
 * @description Emit the Stackra Routing startup banner (per PLAN v3.3).
 *
 *   The banner lists the configured root domain + the advertised dev
 *   subdomains so contributors can copy-paste the URLs from the
 *   terminal. Uses a Unicode box-drawing frame for readability.
 *
 *   The output goes through an injected `writer` so tests can capture
 *   without touching `console.log`. Default writer is `console.log`.
 */

import { Str, collect } from "@stackra/support";

/**
 * Input to `printStartupBanner`.
 */
export interface IStartupBannerInput {
  /** Configured root domain — `undefined` for zero-subdomain apps. */
  readonly rootDomain: string | undefined;

  /**
   * Dev subdomains to list. Ordered as passed; duplicates already
   * removed upstream via `mergeConfig`.
   */
  readonly devSubdomains: readonly string[];

  /**
   * Dev-mode setup — used in the "how to reach a subdomain" copy.
   */
  readonly devMode: "localhost" | "hosts-file" | "proxy";

  /**
   * Dev server port. Included in the URLs so contributors can
   * copy-paste them straight into a browser.
   *
   * @default 5173
   */
  readonly port?: number;

  /**
   * Line writer. Defaults to `console.log`. Tests inject a captured
   * writer to assert on the output.
   */
  readonly writer?: (line: string) => void;
}

/**
 * Emit the startup banner.
 *
 * @param input - Banner input (root domain, subdomain list, ...).
 */
export function printStartupBanner(input: IStartupBannerInput): void {
  const {
    rootDomain,
    devSubdomains,
    devMode,
    port = 5173,
    writer = (line): void => console.log(line),
  } = input;

  const lines: string[] = [];
  // Use a block body so `Array.prototype.push`'s `number` return
  // value is discarded — the arrow is `void`.
  const push = (line: string): void => {
    lines.push(line);
  };

  // Rounded corners on the top/bottom + straight bars on the sides
  // form a legible frame across every terminal that speaks Unicode.
  push("┌─ Stackra Routing ────────────────────────────────");

  push(`│  Root:           ${rootDomain ?? "(none — single-domain SPA)"}`);
  push(`│  Dev URL (root): http://localhost:${port}`);

  // The subdomain suffix depends on the dev-mode. `localhost` is the
  // zero-setup path — `*.localhost` resolves natively on every OS.
  const subdomainSuffix = pickSubdomainSuffix({ rootDomain, devMode });

  if (devSubdomains.length === 0) {
    push("│  Subdomains:     (none advertised — see `router({devSubdomains})`)");
  } else {
    push(`│  Subdomains (${describeDevMode(devMode)}):`);
    // Compute the widest label so `→` columns line up on every row.
    // Fold through `collect(...)` per support-utilities — no direct
    // `Math.max(...map)` chain (collect handles empty lists).
    const widestLabel = collect(devSubdomains.map((sub) => sub.length)).max() ?? 0;

    for (const subdomain of devSubdomains) {
      const padded = Str.padRight(subdomain, widestLabel, " ");
      // The URL uses the same subdomain plus the picked suffix so
      // the value contributors see matches what the middleware will
      // parse from `req.headers.host` (see `parse-subdomain.util`).
      push(`│    ${padded} → http://${subdomain}${subdomainSuffix}:${port}`);
    }
  }

  push("└──────────────────────────────────────────────────");

  for (const line of lines) writer(line);
}

/**
 * Pick the URL suffix to display next to each subdomain based on the
 * dev-mode setup.
 */
function pickSubdomainSuffix(input: {
  readonly rootDomain: string | undefined;
  readonly devMode: "localhost" | "hosts-file" | "proxy";
}): string {
  const { rootDomain, devMode } = input;
  // `localhost` mode always emits `*.localhost` regardless of the
  // configured root — zero setup is the whole point.
  if (devMode === "localhost") return ".localhost";
  // The other two modes ("hosts-file" and "proxy") assume the
  // rootDomain is reachable directly.
  return rootDomain ? `.${rootDomain}` : ".localhost";
}

/**
 * Human-friendly label for the dev-mode used in the banner header.
 */
function describeDevMode(mode: "localhost" | "hosts-file" | "proxy"): string {
  if (mode === "localhost") return "*.localhost — zero setup";
  if (mode === "hosts-file") return "hosts-file — pnpm stackra dev-hosts";
  return "proxy — reverse-proxied";
}
