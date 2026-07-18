/**
 * @file identity-store.ts
 * @module refine/identity-store
 *
 * @description
 * Central store for the current user's identity. Backed by:
 *
 *   1. The last-successful `GET /api/auth/me` payload (source of truth
 *      when authenticated), mapped from the snake_case wire format into
 *      the camelCase {@link Identity} the shell consumes.
 *   2. A JSON fixture used as a fallback in local development when no
 *      token is stored — lets designers + component authors mount the
 *      shell without a running backend.
 *   3. A `localStorage`-cached copy of the last identity so the shell
 *      can paint on cold start (before the async `/me` call resolves).
 *
 * All auth-provider reads pass through {@link getIdentitySnapshot};
 * mutations go through {@link setActiveBranch} and
 * {@link refreshIdentity}. Downstream subscribers (branch switcher,
 * theme provider) can listen via {@link subscribeToIdentity}.
 */

import { useGetIdentity } from "@refinedev/core";

import type { Identity, UserBranchEntry } from "./auth-provider";

import { authApi } from "@/lib/api/auth-api";
import { readAuthToken, writeCachedUser, readCachedUser } from "@/lib/auth/token-store";

/**
 * Well-known feature-flag keys surfaced on `Identity.features`.
 *
 * ## Why constants
 *
 * Every consumer that gates behaviour on a feature must reference
 * these names via the constants — a raw string literal anywhere in
 * the app is a magic-string bug waiting to typo. Adding a feature is
 * a one-line change here, and grep will find every callsite.
 *
 * Backend contract: {@link https://... docs/features.md}
 */
export const FEATURE_KEYS = {
  /**
   * Tenant has at least one active SSO / SAML / OIDC identity
   * provider configured. Backend surfaces this on `me.features`
   * once the Sso module writes an active TenantIdentityProvider row.
   * Frontend gates:
   *  - the "Sign in with SSO" affordance in `SignInAlternatives`
   *  - the `/settings/sso` settings section visibility
   */
  SSO_ENABLED: "sso_enabled",
} as const;

/**
 * Union of every well-known feature key. Callsites should prefer
 * passing a {@link FEATURE_KEYS} constant, but the string fallback
 * keeps the hook usable during migrations where a flag is being
 * introduced on the backend before the frontend catches up.
 */
export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

const ACTIVE_BRANCH_STORAGE_KEY = "academorix:active-branch";

/**
 * Location of the local-dev boot fixture — served by Vite from
 * `apps/dashboard/public/data/`. Kept out of the bundle so a
 * designer can tweak the demo user without a rebuild; consistent
 * with every other mock JSON living under `public/`.
 */
const DEV_FIXTURE_URL = "/data/current-user.json";

/**
 * Whether we're in local-dev mode. The identity store falls back to
 * the JSON fixture when this is `true` **and** no auth token is
 * stored — production always waits for the real `/me` response.
 */
const IS_LOCAL_DEV =
  (import.meta.env.VITE_APP_ENV as string | undefined) === "local" || import.meta.env.DEV;

/**
 * Minimal placeholder returned by {@link getIdentitySnapshot} before
 * either the dev fixture or the real `/me` payload has resolved.
 * Callsites that render straight off the snapshot see an empty shell
 * — the branch switcher / features gate everything fail-open so the
 * short blank frame is invisible on localhost, and the shell repaints
 * as soon as {@link identity} is populated.
 */
const EMPTY_IDENTITY: Identity = {
  id: "",
  name: "",
  email: "",
  initials: "?",
  features: [],
  permissions: [],
};

/**
 * Cached dev fixture — populated once at module init (see the
 * top-level `void loadDevFixture()` below). Nulled out until the
 * fetch resolves so `getIdentitySnapshot()` can distinguish "still
 * loading" (fall through to the empty scaffold) from "fetch settled
 * with an empty response" (also fall through).
 */
let FIXTURE_IDENTITY: Identity | null = null;

/**
 * Kicks off a background fetch of the boot fixture in dev builds.
 * The result is stashed in {@link FIXTURE_IDENTITY} and any
 * subscribers who resolved the snapshot in the interim get a fresh
 * notification so the shell can re-render with the demo user.
 *
 * Runs at module-eval time, so the fetch is in flight before the
 * React root even mounts — the payload is ~2 KB from the Vite dev
 * server, so on localhost it typically lands before the first paint.
 * Failures are silent: without a fixture, the shell just stays on
 * the empty scaffold, matching the production fallback.
 */
async function loadDevFixture(): Promise<void> {
  if (!IS_LOCAL_DEV) return;

  try {
    const response = await fetch(DEV_FIXTURE_URL, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return;

    FIXTURE_IDENTITY = (await response.json()) as Identity;

    // If nothing has hydrated the store yet, notify subscribers so
    // the shell repaints with the fixture. We DON'T write to
    // `identity` unconditionally — a real `/me` response that beat
    // us to the finish line must not be clobbered.
    if (identity === null) emit();
  } catch {
    // Silent — falling back to the empty scaffold is the same
    // behaviour prod uses before `/me` resolves.
  }
}

// Start the fetch immediately at module init so the fixture is
// resolved by the time the first React render reads the snapshot on
// a warm localhost.
void loadDevFixture();

/**
 * The in-memory identity snapshot. `null` = unresolved (cold start
 * before `/me` returns and no cached copy available); a full
 * Identity = ready to render the shell.
 */
let identity: Identity | null = null;

const listeners = new Set<(next: Identity | null) => void>();

function emit(): void {
  for (const listener of listeners) listener(identity);
}

/**
 * Layer the persisted branch selection on top of a fresh identity.
 *
 * Extracted as a helper because it applies in two places — first
 * cold-start read from the fixture / cache, and again on every
 * `refreshIdentity` so the switcher's stored preference survives a
 * `/me` refetch (the server round-trips the last-active branch but
 * the ID may lag a beat behind a very recent switch).
 */
function applyStoredBranch(source: Identity): Identity {
  if (typeof window === "undefined") return source;

  try {
    const storedBranchId = window.localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY);

    if (!storedBranchId) return source;

    const branch = source.branches?.find((entry) => entry.id === storedBranchId);

    if (!branch || !source.workspace) return source;

    return {
      ...source,
      workspace: {
        ...source.workspace,
        activeBranchId: branch.id,
        activeBranchName: branch.name,
      },
    };
  } catch {
    return source;
  }
}

/**
 * Map the backend's snake_case identity manifest into the camelCase
 * shape the shell consumes. Kept permissive on missing fields —
 * tenants running with a partial config (no branches, no menu
 * overrides) should still produce a valid Identity that renders a
 * default shell.
 */
function mapMePayload(raw: unknown): Identity {
  const source = raw as Record<string, unknown> | null;

  if (!source) return FIXTURE_IDENTITY ?? EMPTY_IDENTITY;

  const user = (source.user ?? source) as Record<string, unknown>;
  const workspace = source.workspace as Record<string, unknown> | undefined;
  const branchesRaw = source.branches as ReadonlyArray<Record<string, unknown>> | undefined;
  const menuRaw = source.menu as ReadonlyArray<Record<string, unknown>> | undefined;
  const terminologyRaw = source.terminology as Record<string, string> | undefined;

  const initials =
    (user.initials as string | undefined) ??
    inferInitials((user.full_name ?? user.name) as string | undefined);

  return {
    id: String(user.id ?? ""),
    name: String(user.full_name ?? user.name ?? ""),
    email: String(user.email ?? ""),
    initials,
    avatarUrl: (user.avatar_url ?? user.avatarUrl ?? null) as string | null,
    role: (user.role as string | undefined) ?? undefined,
    workspace: workspace
      ? {
          id: String(workspace.id ?? ""),
          name: String(workspace.name ?? ""),
          plan: (workspace.plan as string | undefined) ?? undefined,
          region: (workspace.region as string | undefined) ?? undefined,
          activeBranchId: (workspace.active_branch_id as string | undefined) ?? undefined,
          activeBranchName: (workspace.active_branch_name as string | undefined) ?? undefined,
        }
      : undefined,
    branches: branchesRaw?.map((entry) => ({
      id: String(entry.id ?? ""),
      name: String(entry.name ?? ""),
      city: (entry.city as string | undefined) ?? undefined,
    })),
    features: normalizeFeatures(source.features),
    permissions: (source.permissions as string[] | undefined) ?? [],
    terminology: terminologyRaw,
    menu: menuRaw?.map((entry) => ({
      id: String(entry.id ?? ""),
      label: String(entry.label ?? ""),
      icon: String(entry.icon ?? ""),
      href: (entry.href as string | undefined) ?? undefined,
      external: Boolean(entry.external),
      variant: entry.variant === "danger" ? "danger" : undefined,
      action: entry.action === "sign-out" ? "sign-out" : undefined,
      shortcut: (entry.shortcut as string | undefined) ?? undefined,
    })),
  };
}

/**
 * Normalise the `features` slot on an `/api/auth/me` payload to the
 * canonical `string[]` shape the shell consumes.
 *
 * The backend contract today is a plain string array — one entry per
 * enabled flag — but a future revision may surface features as an
 * object map (`{sso_enabled: true, some_beta: false}`) to carry
 * per-flag metadata. Doing the translation here keeps every consumer
 * (hooks, gates, feature checks) blissfully unaware of the wire
 * shape; only enabled keys end up in the array so `.includes(key)`
 * remains the single check.
 *
 * Unknown / malformed shapes collapse to `[]` — an empty array is
 * the fail-open value that hides gated affordances until the backend
 * tells us otherwise.
 */
function normalizeFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === "string");
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, value]) => value === true)
      .map(([key]) => key);
  }

  return [];
}

/**
 * Fall back to the first two initials of the caller's name — used
 * when the backend hasn't computed the `initials` slot yet.
 * `"Alice Bloom"` → `"AB"`, `"cher"` → `"C"`.
 */
function inferInitials(fullName: string | undefined): string {
  if (!fullName) return "?";

  const words = fullName.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]?.[0]?.toUpperCase() ?? "?";

  return ((words[0]?.[0] ?? "") + (words[words.length - 1]?.[0] ?? "")).toUpperCase();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read the current identity. Never returns `null` — falls back to the
 * dev fixture in local mode and to a minimal placeholder in
 * production so downstream `useGetIdentity()` consumers can render
 * without a nullish guard.
 */
export function getIdentitySnapshot(): Identity {
  if (identity) return identity;

  // In local dev the boot fixture (fetched at module init from
  // `/data/current-user.json`) seeds the shell so component work
  // runs without a backend. Before the fetch lands, or in
  // production, we return an empty scaffold — the shell renders a
  // loading state until either the fixture or the real `/me` fetch
  // resolves.
  if (IS_LOCAL_DEV && FIXTURE_IDENTITY) {
    return applyStoredBranch(FIXTURE_IDENTITY);
  }

  return EMPTY_IDENTITY;
}

/**
 * Is there a valid token stored right now? The auth-provider's
 * `check()` reads this to decide whether to redirect to `/sign-in`.
 */
export function isAuthenticated(): boolean {
  return readAuthToken() !== null;
}

/**
 * Try to seed the in-memory identity from the cached user payload
 * without a network round-trip. Called from `check()` so the shell
 * can paint on cold start before `/me` resolves.
 */
export function hydrateIdentityFromCache(): void {
  if (identity) return;

  const cached = readCachedUser<unknown>();

  if (!cached) return;

  identity = applyStoredBranch(mapMePayload(cached));
  emit();
}

/**
 * Fetch the current `/api/auth/me` and swap it into the store.
 * Called from the auth-provider after login + on-demand when the
 * shell wants a fresh manifest.
 *
 * Failures are propagated so callers can distinguish "user is not
 * authenticated" (401) from a network hiccup — the wrapper `login()`
 * flow in the auth provider tolerates the error and defers to the
 * cached user.
 */
export async function refreshIdentity(): Promise<Identity> {
  const payload = await authApi.me<unknown>();
  const next = applyStoredBranch(mapMePayload(payload));

  identity = next;
  writeCachedUser(payload);
  emit();

  return next;
}

/**
 * Wipe the in-memory identity + notify subscribers. Called from
 * `logout()` so branch switchers, sidebar counts, and any listener
 * synchronously reset to unauthenticated defaults.
 */
export function clearIdentity(): void {
  identity = null;
  emit();
}

/**
 * Subscribe to identity changes. Returns an unsubscribe function.
 * Used by the branch switcher + analytics wiring.
 */
export function subscribeToIdentity(listener: (next: Identity | null) => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Switch the active branch. Persists the selection to `localStorage`
 * and notifies subscribers. Returns the resolved branch entry so the
 * caller can surface toast copy without an extra lookup.
 */
export function setActiveBranch(branchId: string): UserBranchEntry | undefined {
  const current = identity ?? getIdentitySnapshot();
  const branch = current.branches?.find((entry) => entry.id === branchId);

  if (!branch || !current.workspace) return undefined;
  if (current.workspace.activeBranchId === branch.id) return branch;

  identity = {
    ...current,
    workspace: {
      ...current.workspace,
      activeBranchId: branch.id,
      activeBranchName: branch.name,
    },
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, branch.id);
    } catch {
      // no-op: localStorage may be unavailable.
    }
  }

  emit();

  return branch;
}

// ---------------------------------------------------------------------------
// Feature-flag helpers
// ---------------------------------------------------------------------------

/**
 * React hook — returns whether the currently-signed-in identity has
 * the given feature flag enabled.
 *
 * Reads from Refine's `useGetIdentity()` under the hood so the
 * component re-renders when the identity manifest updates (e.g.
 * after a tenant admin enrols an IdP and the backend flips
 * `sso_enabled` on the next `/api/auth/me` fetch).
 *
 * ## Fail-open semantics
 *
 * An empty `features` array means "backend hasn't populated flags
 * for this tenant" and the hook returns `false` so gated affordances
 * stay hidden until we hear otherwise. Missing / unresolved identity
 * (cold start before `/me` returns) also returns `false` for the
 * same reason.
 *
 * @param key one of {@link FEATURE_KEYS} — passing a raw string
 *   compiles because of the union type fallback, but the reviewer's
 *   grep will still find every plain-string caller. Prefer the
 *   constant.
 */
export function useHasFeature(key: FeatureKey | string): boolean {
  const { data: identity } = useGetIdentity<Identity>();

  return Array.isArray(identity?.features) && identity!.features.includes(key);
}

/**
 * Non-hook snapshot read — useful in event handlers, router
 * loaders, or any code path that can't legally call hooks. Reads
 * the current mutable identity via {@link getIdentitySnapshot} so
 * the answer matches whatever the hook version would return on the
 * next render.
 *
 * Same fail-open semantics as {@link useHasFeature}: an empty or
 * missing `features` array returns `false`.
 */
export function hasFeatureSnapshot(key: FeatureKey | string): boolean {
  const snapshot = getIdentitySnapshot();

  return Array.isArray(snapshot.features) && snapshot.features.includes(key);
}
