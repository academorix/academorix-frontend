/**
 * @file dev-subdomain-middleware.util.ts
 * @module @stackra/routing/vite/subdomain
 * @description Vite dev-server middleware that parses the subdomain
 *   from every incoming request + exposes it to the runtime.
 *
 *   Responsibilities (per PLAN v3.3):
 *
 *   1. Parse the subdomain from `req.headers.host` against the
 *      configured `rootDomain`.
 *   2. Honour the `?_subdomain=` query override when the plugin was
 *      instantiated with `allowDevSubdomainQuery: true`.
 *   3. Write the resolved value onto `globalThis.__STACKRA_DEV_SUBDOMAIN__`
 *      so the virtual `virtual:stackra-routing/dev-subdomain` module
 *      surfaces it to the runtime.
 *   4. Attach `req.stackraSubdomain` for third-party middleware +
 *      debugging.
 *
 *   The middleware is completely fail-soft — a malformed request never
 *   breaks the dev server. `next()` is always called.
 */

import type { IncomingMessage, ServerResponse } from "node:http";

import { parseSubdomain } from "./parse-subdomain.util";

/**
 * Options accepted by `createDevSubdomainMiddleware`.
 */
export interface IDevSubdomainMiddlewareOptions {
  /** Configured root domain — passed through to `parseSubdomain`. */
  readonly rootDomain: string | undefined;

  /**
   * Whether to honour a `?_subdomain=` query override. When `true`,
   * the query value wins over the parsed host.
   */
  readonly allowDevSubdomainQuery: boolean;
}

/**
 * Vite dev-server middleware signature (`connect`-compatible).
 * `next` is optional in `connect`'s runtime shape but the caller
 * always provides one — declaring it non-optional simplifies the
 * body.
 */
export type DevMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void;

/**
 * Construct the dev-server middleware.
 *
 * @param options - Root-domain / query-override configuration.
 * @returns A `connect`-compatible middleware function.
 */
export function createDevSubdomainMiddleware(
  options: IDevSubdomainMiddlewareOptions,
): DevMiddleware {
  const { rootDomain, allowDevSubdomainQuery } = options;

  return function stackraDevSubdomain(req, _res, next) {
    // Fail-soft — every path below tolerates malformed URLs / headers.
    // A crash in the middleware would break the whole dev server for
    // an unrelated request.
    try {
      // The `?_subdomain=` override wins when both are set. Only
      // honour it when the plugin was configured to allow it — the
      // default is OFF so accidental production leaks stay closed.
      let resolved: string | null = null;

      if (allowDevSubdomainQuery && typeof req.url === "string") {
        // `req.url` on a dev-server middleware is a path (no scheme +
        // host). Build a URL against a placeholder base so
        // `searchParams` works uniformly.
        const parsedUrl = new URL(req.url, "http://placeholder.local/");
        const override = parsedUrl.searchParams.get("_subdomain");
        if (override && override.length > 0) {
          resolved = override;
        }
      }

      // Fall back to parsing the host header.
      if (resolved === null) {
        const hostHeader = req.headers.host;
        resolved = parseSubdomain(hostHeader, rootDomain);
      }

      // Expose the value in two channels:
      //   1. `globalThis` — read by the virtual module the runtime
      //      imports. Uses a well-known key so the virtual module's
      //      source stays static.
      //   2. `req.stackraSubdomain` — surface for downstream
      //      middleware (audit / telemetry) that inspect the request
      //      directly.
      (globalThis as { __STACKRA_DEV_SUBDOMAIN__?: string | null }).__STACKRA_DEV_SUBDOMAIN__ =
        resolved;
      (req as unknown as { stackraSubdomain?: string | null }).stackraSubdomain = resolved;
    } catch {
      // fail-soft — parsing errors on a single request must never
      // stop the dev server. Clear the global so a subsequent request
      // doesn't inherit a stale value.
      (globalThis as { __STACKRA_DEV_SUBDOMAIN__?: string | null }).__STACKRA_DEV_SUBDOMAIN__ =
        null;
    }

    next();
  };
}
