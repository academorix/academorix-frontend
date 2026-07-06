/**
 * @file host.ts
 * @module lib/http/host
 *
 * @description
 * Resolves the **host context** the SPA is running in. Academorix ships a
 * single build served from three kinds of host (matching the backend's tenant
 * identification model):
 *
 * - **Central** — `academorix.app` (workspace picker, marketing, self-serve
 *   tenant creation). Auth is the tenant surface only when the user picks a
 *   workspace and gets redirected to their subdomain; there is no "central
 *   member" concept.
 * - **Central admin** — `admin.academorix.app` (Academorix staff surface). The
 *   backend's `platform.domain` middleware only accepts requests from central
 *   hosts, so the admin surface must be central. Auth is the **platform** flow.
 * - **Tenant** — `{slug}.academorix.app` or a custom domain (`academy.example.com`).
 *   The backend's `stancl/tenancy` `InitializeTenancyByDomain` middleware
 *   resolves the tenant from the request host. Auth is the **tenant** flow.
 *
 * The context is derived from `window.location.hostname` at boot; the SPA
 * never mutates it (a tenant switch is a full page navigation to the new host).
 *
 * ### Dev fallback
 * On `localhost` / `127.0.0.1` we treat the app as running against the tenant
 * surface (matching the mock-first developer flow) but expose the derived
 * `apiOrigin` from `VITE_API_URL`, so requests reach the local Laravel server.
 */

import { envConfig } from "@/config/env.config";

/** The three host kinds the SPA can boot in. */
export type HostKind = "central" | "central-admin" | "tenant";

/** The resolved host context, used by the HTTP client + tenancy layer. */
export interface HostContext {
  /** The kind of host the browser is on. */
  kind: HostKind;
  /** The raw hostname, e.g. `"riverside.academorix.app"`. */
  hostname: string;
  /**
   * The tenant slug when `kind === "tenant"` on a subdomain of the central host
   * (e.g. `"riverside"` for `riverside.academorix.app`). `null` for custom
   * domains (the backend still resolves the tenant from the `Domain` row) and
   * for central / central-admin hosts.
   */
  tenantSlug: string | null;
  /**
   * Absolute API origin **including** the API path prefix. Requests are made
   * to `${apiOrigin}/auth/login`, `${apiOrigin}/v1/tenants`, etc.
   *
   * In production this is same-origin (e.g. `https://riverside.academorix.app/api`)
   * so cookies/subdomain isolation work; in dev it points at the standalone
   * Laravel server via `VITE_API_URL`.
   */
  apiOrigin: string;
  /** Whether the current host is one of the central hosts (workspace / admin). */
  isCentral: boolean;
  /** Whether this is a dev environment (localhost/127.0.0.1/::1). */
  isLocalhost: boolean;
}

/** Trims trailing slashes so joins like `${origin}${path}` stay clean. */
function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** Whether a hostname is a local development host. */
function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}

/**
 * Extracts the tenant slug when the current hostname is a subdomain of the
 * configured central host. Returns `null` for the central host itself, the
 * admin host, or a custom domain.
 */
function extractTenantSlug(
  hostname: string,
  centralHost: string,
  adminHost: string,
): string | null {
  const lowerHost = hostname.toLowerCase();
  const lowerCentral = centralHost.toLowerCase();
  const lowerAdmin = adminHost.toLowerCase();

  if (
    lowerHost === lowerCentral ||
    lowerHost === `www.${lowerCentral}` ||
    lowerHost === lowerAdmin
  ) {
    return null;
  }

  // A subdomain of the central host: strip the ".{central}" suffix.
  const suffix = `.${lowerCentral}`;

  if (lowerHost.endsWith(suffix)) {
    const slug = lowerHost.slice(0, -suffix.length);

    // Reserved subdomains never resolve to a tenant.
    if (slug === "" || slug === "www" || slug === "api") {
      return null;
    }

    return slug;
  }

  // Custom domain — the backend still resolves a tenant, but we do not know
  // its slug from the URL alone.
  return null;
}

/**
 * Resolves the host context from `window.location`. Cached in module scope so
 * every caller sees the exact same value (host cannot change without a full
 * page navigation).
 */
let cached: HostContext | null = null;

/**
 * Returns the current host context. Safe to call from anywhere, at any time.
 * In non-browser environments (SSR, tests) returns a deterministic fallback
 * where `apiOrigin = VITE_API_URL + VITE_API_PATH`.
 */
export function resolveHostContext(): HostContext {
  if (cached) {
    return cached;
  }

  const centralHost = envConfig.centralHost.toLowerCase();
  const adminHost = envConfig.platformAdminHost.toLowerCase();
  const apiPath = envConfig.apiPath.startsWith("/") ? envConfig.apiPath : `/${envConfig.apiPath}`;

  // SSR / test fallback.
  if (typeof window === "undefined" || !window.location) {
    cached = {
      kind: "tenant",
      hostname: "localhost",
      tenantSlug: null,
      apiOrigin: `${trimTrailingSlash(envConfig.apiUrl)}${apiPath}`,
      isCentral: false,
      isLocalhost: true,
    };

    return cached;
  }

  const hostname = window.location.hostname.toLowerCase();
  const isLocalhost = isLocalHostname(hostname);

  // Same-origin API in production (SPA is served from the same host as Laravel).
  // In dev, point at `VITE_API_URL` because Vite is on :3000 and Laravel on :8000.
  const apiOrigin = isLocalhost
    ? `${trimTrailingSlash(envConfig.apiUrl)}${apiPath}`
    : `${window.location.origin}${apiPath}`;

  let kind: HostKind;

  if (hostname === adminHost) {
    kind = "central-admin";
  } else if (hostname === centralHost || hostname === `www.${centralHost}`) {
    kind = "central";
  } else {
    // Tenant subdomain OR custom domain OR localhost — all use the tenant surface.
    kind = "tenant";
  }

  const tenantSlug = kind === "tenant" ? extractTenantSlug(hostname, centralHost, adminHost) : null;

  cached = {
    kind,
    hostname,
    tenantSlug,
    apiOrigin,
    isCentral: kind === "central" || kind === "central-admin",
    isLocalhost,
  };

  return cached;
}

/** For tests only — forces re-resolution on the next call. */
export function __resetHostContextForTests(): void {
  cached = null;
}

/**
 * Builds a URL for a tenant host given its slug, preserving the current
 * protocol + port. Used by the workspace switcher to full-navigate to a
 * different tenant.
 */
export function buildTenantUrl(slug: string, pathname = "/"): string {
  const centralHost = envConfig.centralHost;

  if (typeof window === "undefined") {
    return `https://${slug}.${centralHost}${pathname}`;
  }

  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";

  return `${protocol}//${slug}.${centralHost}${portSuffix}${pathname}`;
}

/**
 * Builds a URL for the central host, preserving protocol + port. Used for
 * "back to workspaces" links from a tenant page.
 */
export function buildCentralUrl(pathname = "/"): string {
  const centralHost = envConfig.centralHost;

  if (typeof window === "undefined") {
    return `https://${centralHost}${pathname}`;
  }

  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";

  return `${protocol}//${centralHost}${portSuffix}${pathname}`;
}
