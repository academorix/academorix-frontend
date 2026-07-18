/**
 * @file redirect.signal.ts
 * @module @stackra/routing/middleware/signals
 * @description Control-flow signal + throwing helper for redirects.
 *
 *   `RedirectSignal` extends `Error` so callers can throw it, and
 *   `redirect(url, status?)` is the ergonomic thrower helper —
 *   `throw redirect(...)` short-circuits the pipeline into an HTTP-
 *   style redirect. The class and its helper live in a single file
 *   because they are one conceptual unit (the class carries no other
 *   consumer; the helper only exists to throw the class).
 *
 *   The `kind: 'redirect'` discriminator matches the shape of
 *   `IRedirectSignal` from `@stackra/contracts`, letting the outer
 *   pipeline detect the signal without an `instanceof` check.
 */

import type { IRedirectSignal } from "@stackra/contracts";

/**
 * Signal indicating the pipeline should terminate with an HTTP-style
 * redirect. Caught at the outer boundary and converted to a router
 * navigation (SPA) or `Response` (build-time prerender).
 *
 * Status code must be an integer in `[300, 308]` — anything else
 * throws `TypeError` at construction time.
 */
export class RedirectSignal extends Error implements IRedirectSignal {
  /** Discriminator — always `'redirect'`. */
  public readonly kind = "redirect" as const;

  /** Destination URL. */
  public readonly url: string;

  /** HTTP status in `[300, 308]`. */
  public readonly status: number;

  /**
   * @param url    - Destination URL (absolute or relative).
   * @param status - HTTP status in `[300, 308]`.
   * @throws {TypeError} When `status` is outside the redirect range.
   */
  public constructor(url: string, status: number = 302) {
    // Validate up front — an invalid redirect status thrown into the
    // pipeline is impossible to recover from downstream.
    if (!Number.isInteger(status) || status < 300 || status > 308) {
      throw new TypeError(
        `RedirectSignal: status must be an integer in [300, 308], got ${status}.`,
      );
    }
    super(`Redirect to ${url} (${status})`);
    this.name = "RedirectSignal";
    this.url = url;
    this.status = status;
  }
}

/**
 * Terminate the current pipeline and redirect to `url`.
 *
 * @param url    - Absolute or relative URL to redirect to.
 * @param status - HTTP status in `[300, 308]`. Defaults to `302`.
 * @throws {RedirectSignal} Always — this function never returns.
 * @throws {TypeError} When `status` is outside the redirect range.
 *
 * @example
 * ```typescript
 * import { redirect } from '@stackra/routing';
 *
 * @Guard({ name: 'auth' })
 * class AuthGuard implements ICanActivate {
 *   canActivate() {
 *     if (!this.user) redirect('/sign-in');
 *     return true;
 *   }
 * }
 * ```
 */
export function redirect(url: string, status: number = 302): never {
  throw new RedirectSignal(url, status);
}
