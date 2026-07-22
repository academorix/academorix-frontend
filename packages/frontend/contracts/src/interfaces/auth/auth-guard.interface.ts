/**
 * @file auth-guard.interface.ts
 * @module @stackra/contracts/interfaces/auth
 * @description Small policy-shaped auth surface separate from
 *   `IAuthService`. Consumers that need to render UI conditionally
 *   (dev-tool panels, feature gates, admin-only widgets) inject the
 *   `AUTH_SERVICE` token and type it as `IAuthGuard` — they never
 *   need the full `login` / `logout` / `challenge` workflow.
 *
 *   The concrete `AuthService` in `@stackra/auth` implements both
 *   `IAuthService` (full workflow) and `IAuthGuard` (policy).
 *   Downstream consumers pick the narrower shape.
 */

/**
 * Minimal policy-shaped auth surface.
 *
 * All members are optional so a consumer can fail-open when the
 * underlying implementation doesn't provide them (typical for
 * headless / SSR contexts, or when a caller-supplied override is
 * only partial).
 */
export interface IAuthGuard {
  /**
   * Whether the current session is authenticated.
   *
   * Can be a plain boolean (snapshot) or a function returning one
   * (reactive/computed). Consumers narrow at the call site.
   */
  readonly isAuthenticated?: boolean | (() => boolean);

  /**
   * The current user object, when available. Consumers should
   * treat this as opaque — inspect via a domain-specific
   * `IIdentity` interface when needed.
   */
  readonly currentUser?: unknown;

  /**
   * Policy check — is the current session allowed to perform
   * `ability` on the optional `resource`?
   *
   * @param ability - Ability identifier (e.g. `"devtools.view"`).
   * @param resource - Optional resource the check runs against.
   * @returns `true` when allowed, `false` otherwise.
   */
  can?: (ability: string, resource?: unknown) => boolean;
}
