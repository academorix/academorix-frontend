/**
 * @file workspace-resolver.ts
 * @module lib/auth/workspace-resolver
 *
 * @description
 * Resolves the "active workspace" from the browser URL.
 *
 * ## Model
 *
 * Every tenant workspace lives on its own subdomain of the central host:
 *
 *   - `academorix.mydomain.com` → workspace slug = `academorix`
 *   - `riyadh-athletics.mydomain.com` → workspace slug = `riyadh-athletics`
 *   - `mydomain.com` → central host, no workspace (workspace picker mode)
 *   - `admin.mydomain.com` → platform admin console (out of scope here)
 *
 * The central host is configured via `VITE_CENTRAL_HOST` in the .env,
 * which defaults to `localhost` for dev. Anything ending with the
 * central host and having at least one additional segment is treated
 * as a tenant subdomain — the slug is the leading segment.
 *
 * ## Why not read from the identity manifest instead
 *
 * We need this on the sign-in page **before** we have an identity —
 * the resolver decides whether to render the workspace picker or the
 * email + password form. Parsing the hostname is the only signal
 * available at that point.
 */

/**
 * The central-host token from the environment, with a safe dev
 * fallback of `localhost`. Modern browsers (Chrome, Firefox, Safari,
 * Edge) resolve any `<slug>.localhost` to `127.0.0.1` per RFC 6761,
 * so tenant subdomains like `acme-athletics.localhost:3000` work
 * out of the box in dev — no `/etc/hosts` edits required. The Vite
 * dev server's `allowedHosts: true` in `vite.config.ts` accepts any
 * hostname pointing at the same port.
 */
const CENTRAL_HOST = (import.meta.env.VITE_CENTRAL_HOST as string | undefined) ?? "localhost";

/**
 * The platform-admin host — never a tenant workspace, even though it
 * matches the subdomain pattern.
 */
const PLATFORM_ADMIN_HOST =
  (import.meta.env.VITE_PLATFORM_ADMIN_HOST as string | undefined) ?? "admin.localhost";

/** Marketing site host — same treatment as platform admin. */
const MARKETING_HOST_HINT = "www";

/**
 * Resolved workspace context, returned by {@link resolveWorkspace}.
 *
 * The three cases the caller has to handle are captured by
 * discriminated variants:
 *
 *   - `mode: "tenant"` — the current URL points at a tenant
 *     subdomain. Show the sign-in form scoped to `slug`.
 *   - `mode: "central"` — the current URL is the central host or
 *     an unclassified variant. Show the workspace picker.
 *   - `mode: "platform-admin"` — reserved; the dashboard never
 *     renders on this host (platform admin has its own SPA).
 */
export type ResolvedWorkspace =
  | { mode: "tenant"; slug: string; hostname: string }
  | { mode: "central"; hostname: string }
  | { mode: "platform-admin"; hostname: string };

/**
 * Extract the workspace slug from the current hostname.
 *
 * Returns a discriminated envelope so the caller can render the
 * matching UI without a second lookup. Kept pure (no side effects)
 * so tests + storybook can pass a hostname in and assert without
 * standing up `window`.
 *
 * @param hostname - Optional override. Defaults to
 *   `window.location.hostname` in a browser context. Used by tests to
 *   exercise every branch.
 */
export function resolveWorkspace(hostname?: string): ResolvedWorkspace {
  // SSR / test fallback — the caller passes an explicit hostname.
  const raw = hostname ?? (typeof window === "undefined" ? "" : window.location.hostname);
  const normalised = raw.toLowerCase();

  if (!normalised) {
    return { mode: "central", hostname: "" };
  }

  if (normalised === PLATFORM_ADMIN_HOST) {
    return { mode: "platform-admin", hostname: normalised };
  }

  // Exact match on the central host — no subdomain component.
  if (normalised === CENTRAL_HOST) {
    return { mode: "central", hostname: normalised };
  }

  // Central host with the `www` marketing prefix — treat the same as
  // the bare central host.
  if (normalised === `${MARKETING_HOST_HINT}.${CENTRAL_HOST}`) {
    return { mode: "central", hostname: normalised };
  }

  // Tenant subdomain candidate — the hostname ends with the central
  // host token AND has at least one extra segment in front. Split
  // once on the terminal segment so multi-level slugs like
  // `sub.brand.mydomain.com` keep their full prefix as the slug
  // (`sub.brand`), which the backend supports.
  //
  // This branch is the one that lights up in dev too: browsers
  // resolve `<slug>.localhost` to `127.0.0.1` by RFC 6761, so a
  // tenant URL like `acme-athletics.localhost:3000` hits the same
  // Vite dev server and this resolver sees the slug directly from
  // the hostname — no client-side mock override needed.
  const suffix = `.${CENTRAL_HOST}`;

  if (normalised.endsWith(suffix)) {
    const slug = normalised.slice(0, -suffix.length);

    if (slug && slug !== MARKETING_HOST_HINT) {
      return { mode: "tenant", slug, hostname: normalised };
    }
  }

  // Fallback — an unknown domain (e.g. a custom vanity host) is
  // treated as central; the workspace picker + explicit URL entry
  // covers the manual path in until we ship domain-mapping metadata.
  return { mode: "central", hostname: normalised };
}

/**
 * Build the tenant URL for a given workspace slug so the workspace
 * picker can redirect there. Uses `window.location.port` +
 * `window.location.protocol` to survive local-dev port numbers
 * (`localhost:3000`) and HTTPS-in-production.
 */
export function buildTenantUrl(slug: string): string {
  if (typeof window === "undefined") {
    return `https://${slug}.${CENTRAL_HOST}`;
  }

  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";

  return `${protocol}//${slug}.${CENTRAL_HOST}${portSuffix}`;
}

/**
 * Build the central-host URL — used by the "Change workspace" link
 * on the tenant sign-in page. Same port/protocol preservation as
 * {@link buildTenantUrl}.
 */
export function buildCentralUrl(): string {
  if (typeof window === "undefined") {
    return `https://${CENTRAL_HOST}`;
  }

  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";

  return `${protocol}//${CENTRAL_HOST}${portSuffix}`;
}
