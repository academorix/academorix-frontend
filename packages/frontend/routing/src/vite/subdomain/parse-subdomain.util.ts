/**
 * @file parse-subdomain.util.ts
 * @module @stackra/routing/vite/subdomain
 * @description Parse a subdomain out of a request host header.
 *
 *   The rules mirror the runtime matcher context (`IMatcherContext.subdomain`)
 *   so the plugin's dev middleware and the framework runtime agree on
 *   what "no subdomain" means:
 *
 *   - No `rootDomain` set → no subdomain (return `null`).
 *   - Host matches the root domain exactly (with or without port) →
 *     no subdomain (return `null`).
 *   - Host is a `www.<rootDomain>` prefix → treated as the apex
 *     (return `null`, mirroring the "www is the apex" convention every
 *     other tenant framework ships).
 *   - Host is `<sub>.<rootDomain>` → return `sub` (all lowercase).
 *   - Host is `<sub1>.<sub2>.<rootDomain>` → return the entire tenant
 *     path (`sub1.sub2`) — nested subdomains stay together so tenant
 *     lookups see the exact identifier.
 *   - Host doesn't end with `rootDomain` → return `null` (foreign
 *     host, ignored).
 *
 *   Uses `Str.lower` from `@stackra/support` per the support-utilities
 *   rule — no hand-rolled `.toLowerCase()`.
 */

import { Str } from "@stackra/support";

/**
 * Parse the subdomain out of a request host header.
 *
 * @param host       - The `Host` header value (may include a `:port`
 *   suffix; the port is stripped before parsing).
 * @param rootDomain - The configured root domain (`rootDomain` option
 *   on `router({...})`). When absent, the parser returns `null`.
 * @returns The parsed subdomain string, or `null` when the request
 *   targets the apex domain (or when parsing isn't possible).
 *
 * @example
 * ```typescript
 * parseSubdomain('admin.stackra.app', 'stackra.app');
 * // → 'admin'
 * parseSubdomain('www.stackra.app', 'stackra.app');
 * // → null (www is the apex)
 * parseSubdomain('stackra.app:5173', 'stackra.app');
 * // → null (root)
 * ```
 */
export function parseSubdomain(
  host: string | undefined,
  rootDomain: string | undefined,
): string | null {
  // A missing host header means we can't parse anything — the caller
  // gets `null` and the runtime falls back to "no subdomain".
  if (!host) return null;
  // Without a configured root domain, subdomain routing is off.
  if (!rootDomain) return null;

  // Strip a `:port` suffix + normalise case. `Str.lower` funnels the
  // lowercase call through the canonical support helper (rule:
  // support-utilities — never a bare `.toLowerCase()`).
  const withoutPort = host.split(":", 1)[0] ?? "";
  const normalizedHost = Str.lower(withoutPort);
  const normalizedRoot = Str.lower(rootDomain);

  // Exact match on the root domain → apex.
  if (normalizedHost === normalizedRoot) return null;

  // Host must end with `.<root>` to be considered part of the tenant
  // family. Anything else is a foreign host — return `null` so the
  // runtime doesn't route it into a tenant shell.
  const suffix = `.${normalizedRoot}`;
  if (!Str.endsWith(normalizedHost, suffix)) return null;

  // Strip the trailing suffix — what's left is the tenant path.
  const rawSubdomain = normalizedHost.slice(0, -suffix.length);
  if (rawSubdomain.length === 0) return null;

  // `www` is aliased to the apex — every tenant framework does this,
  // and matching this convention here keeps the framework consistent
  // with well-known SEO / cookie / CORS behaviour.
  if (rawSubdomain === "www") return null;

  return rawSubdomain;
}
