/**
 * @file workspace-branding.ts
 * @module lib/auth/workspace-branding
 *
 * @description
 * Runtime helpers for painting a tenant's brand colours onto the auth
 * surfaces. Two responsibilities:
 *
 *   1. `useWorkspaceBranding(slug)` — a React hook that fetches
 *      `GET /api/v1/workspaces/{slug}` and returns the preview
 *      envelope alongside its loading / error state.
 *   2. `applyWorkspaceCssVars(preview)` — writes the tenant's brand
 *      colours as CSS custom properties on `document.documentElement`
 *      so downstream `--color-accent` reads pick them up without a
 *      re-render loop.
 *
 * ## Why CSS variables (not a React context)
 *
 * The dashboard uses Tailwind + CSS custom properties for every
 * themable token; wiring branding through a React context would
 * duplicate that mechanism and force every consumer to import a
 * hook. Writing the values onto `:root` lets every existing
 * `bg-accent`, `text-accent`, `border-accent` class pick up the
 * tenant tone with zero call-site changes.
 */

import { useEffect, useState } from "react";

import type { WorkspacePreview } from "@/lib/api/auth-api";

import { ApiError } from "@/lib/api/http-client";
import { authApi } from "@/lib/api/auth-api";

/** Cache of preview responses so quick re-renders don't refetch. */
const previewCache = new Map<string, WorkspacePreview>();

/** Namespaced storage key for the sessionStorage cache. */
const SESSION_CACHE_KEY = "academorix.auth.workspace-preview";

/**
 * Read the sessionStorage-persisted preview cache — used across
 * page reloads so the second load of `/sign-in` on the same tenant
 * paints branded chrome without a network round-trip.
 */
function readSessionCache(): Record<string, WorkspacePreview> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);

    if (!raw) return {};

    return JSON.parse(raw) as Record<string, WorkspacePreview>;
  } catch {
    return {};
  }
}

/**
 * Persist the preview cache to sessionStorage. Silent on failure so a
 * `SecurityError` in private mode doesn't tear the sign-in page down.
 */
function writeSessionCache(next: Record<string, WorkspacePreview>): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(next));
  } catch {
    // no-op
  }
}

/**
 * Return the cached preview for a slug, or `undefined`. Checks the
 * in-memory map first (populated during the current tab) and falls
 * through to sessionStorage (populated across reloads).
 */
export function readCachedPreview(slug: string): WorkspacePreview | undefined {
  const normalised = slug.toLowerCase();

  const memoryHit = previewCache.get(normalised);

  if (memoryHit) return memoryHit;

  const session = readSessionCache();
  const sessionHit = session[normalised];

  if (sessionHit) previewCache.set(normalised, sessionHit);

  return sessionHit;
}

/** Envelope returned by {@link useWorkspaceBranding}. */
export interface UseWorkspaceBrandingResult {
  /** The preview payload once resolved. `null` before the fetch settles. */
  preview: WorkspacePreview | null;
  /** True while the network call is in flight. */
  isLoading: boolean;
  /**
   * Non-null when the lookup fails. `code === "workspace_not_found"`
   * signals a 404 (unknown slug or inaccessible tenant); other codes
   * indicate a transient network / 500 error.
   */
  error: { message: string; code: string } | null;
}

/**
 * Fetch + cache a workspace preview by slug.
 *
 * The hook keeps the last-successful preview in memory and in
 * sessionStorage so navigating between auth pages (`/sign-in` ↔
 * `/forgot-password`) doesn't refetch. Passing `null` as the slug
 * short-circuits the fetch and returns an unresolved state — used
 * by the workspace picker before the caller has typed anything.
 */
export function useWorkspaceBranding(slug: string | null): UseWorkspaceBrandingResult {
  const normalised = slug ? slug.toLowerCase() : null;
  const [preview, setPreview] = useState<WorkspacePreview | null>(() =>
    normalised ? (readCachedPreview(normalised) ?? null) : null,
  );
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);

  useEffect(() => {
    if (!normalised) {
      setPreview(null);
      setError(null);
      setLoading(false);

      return;
    }

    // Cache hit — surface immediately, still refetch in the
    // background so a stale preview doesn't stick around forever.
    const cached = readCachedPreview(normalised);

    if (cached) {
      setPreview(cached);
    }

    setLoading(true);
    setError(null);

    let cancelled = false;

    authApi
      .previewWorkspace(normalised)
      .then((next) => {
        if (cancelled) return;

        previewCache.set(normalised, next);
        writeSessionCache({ ...readSessionCache(), [normalised]: next });
        setPreview(next);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;

        // WHY the cache invalidation on any error: a slug that was
        // valid yesterday and 404s today (workspace suspended)
        // shouldn't linger on the SPA. Clearing preserves the last
        // network truth without any cross-render staleness.
        previewCache.delete(normalised);
        setPreview(null);

        if (caught instanceof ApiError) {
          setError({ message: caught.message, code: caught.code });
        } else {
          setError({
            message:
              "We couldn't reach the workspace directory. Check your connection and try again.",
            code: "network_error",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [normalised]);

  return { preview, isLoading, error };
}

/**
 * Convert a hex string (`"#7c3aed"`, `"7c3aed"`) into a
 * space-separated triplet suitable for a Tailwind `rgb(var(--…))`
 * consumer. Returns `null` for anything that doesn't parse cleanly
 * so callers can bail without a runtime error.
 */
function hexToRgbTriplet(hex: string | null | undefined): string | null {
  if (!hex) return null;

  const normalised = hex.replace(/^#/, "");
  const expanded =
    normalised.length === 3
      ? normalised
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : normalised;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;

  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);

  return `${r} ${g} ${b}`;
}

/**
 * Write the tenant's brand colours onto `document.documentElement`
 * as CSS custom properties. Every existing `bg-accent` /
 * `text-accent` class in the SPA reads the same variables, so the
 * whole tree picks up the tenant tone on the next paint.
 *
 * We use `--brand-primary`, `--brand-secondary`, `--brand-accent`
 * as scoped keys so the base HeroUI theme tokens
 * (`--color-accent`, …) can still be overridden by higher-level
 * theming code without a conflict.
 *
 * Returns a `cleanup` function that removes every property this
 * call added — useful for the sign-out path so the central-host
 * chrome doesn't inherit the last-visited tenant's colours.
 */
export function applyWorkspaceCssVars(preview: WorkspacePreview | null): () => void {
  if (typeof document === "undefined" || !preview) return () => {};

  const root = document.documentElement;
  const written: string[] = [];
  const setVar = (key: string, value: string | null) => {
    if (!value) return;

    root.style.setProperty(key, value);
    written.push(key);
  };

  setVar("--brand-primary", preview.primary_color ?? null);
  setVar("--brand-secondary", preview.secondary_color ?? null);
  setVar("--brand-accent", preview.accent_color ?? null);

  // RGB-triplet variants — required by any consumer that wants to
  // compose `rgb(var(--brand-primary-rgb) / <alpha>)` for
  // translucency. Kept as a sibling of the raw hex so consumers
  // pick the form they need.
  setVar("--brand-primary-rgb", hexToRgbTriplet(preview.primary_color));
  setVar("--brand-secondary-rgb", hexToRgbTriplet(preview.secondary_color));
  setVar("--brand-accent-rgb", hexToRgbTriplet(preview.accent_color));

  return () => {
    for (const key of written) root.style.removeProperty(key);
  };
}
