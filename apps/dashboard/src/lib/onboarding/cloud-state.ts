/**
 * @file cloud-state.ts
 * @module onboarding/cloud-state
 *
 * @description
 * Opportunistic sync of the onboarding state (tour, checklist, PWA,
 * desktop) to the backend so a user picks up where they left off across
 * devices. See onboarding module / Phase 2 for the migration
 * story.
 *
 * ## Contract
 *
 *  - Endpoint: `PATCH /api/v1/users/me/onboarding` with a
 *    {@link CloudOnboardingState} body. Backend merges + returns the
 *    canonical state (same shape).
 *  - The frontend NEVER awaits the sync on a critical path — this is
 *    strictly opportunistic. A network failure, 404 (endpoint doesn't
 *    exist yet), or 401 is silently swallowed. LocalStorage is still
 *    the source of truth.
 *  - When the endpoint returns a merged payload with `restoredFromCloud
 *    = true`, {@link syncOnboardingStateOnce} writes it back into
 *    localStorage so subsequent readers see the cloud-merged view.
 *  - The whole file is marked TODO(backend-endpoint) — the API contract
 *    is speculative and expected to land alongside the Laravel-side
 *    user preferences module.
 *
 * ## When it fires
 *
 * A single sync runs once per session on identity resolution
 * ({@link useCloudOnboardingSync}). The hook is idempotent so remounts
 * (route transitions, React Strict Mode double-invoke) don't fire
 * duplicate PATCHes.
 */

import { useGetIdentity } from "@refinedev/core";
import { useEffect, useRef } from "react";

import type { CloudOnboardingState } from "@/lib/onboarding/onboarding.types";
import type { Identity } from "@/types";

import { httpClient } from "@/lib/http";
import {
  readChecklistState,
  readDesktopState,
  readPwaState,
  readTourState,
  writeChecklistState,
  writeDesktopState,
  writePwaState,
  writeTourState,
} from "@/lib/onboarding/storage";

// ---------------------------------------------------------------------------
// Endpoint contract
// ---------------------------------------------------------------------------

/**
 * The endpoint path (relative to the SPA's API base). The `me` alias
 * lets the backend look up the identity via the bearer token — the SPA
 * never sends the user id in the URL.
 *
 * TODO(backend-endpoint): The Laravel `user-preferences` module hasn't
 * shipped this endpoint yet. The route lands under
 * `/api/v1/users/me/onboarding` with methods:
 *   - `GET`   → returns the current server-side snapshot.
 *   - `PATCH` → accepts a partial {@link CloudOnboardingState},
 *              merges + returns the canonical view.
 * Until then, the client swallows 404 silently.
 */
const ONBOARDING_ENDPOINT = "/v1/users/me/onboarding";

// ---------------------------------------------------------------------------
// Pure helpers — build the current payload from localStorage
// ---------------------------------------------------------------------------

/**
 * Assembles the current localStorage state into the wire payload the
 * backend expects. Kept pure so tests can call it against a controlled
 * user id.
 */
export function collectLocalOnboardingState(userId: string | null): CloudOnboardingState {
  return {
    tour: readTourState(userId),
    checklist: readChecklistState(userId),
    pwa: readPwaState(userId),
    desktop: readDesktopState(userId),
  };
}

/**
 * Writes a full server-authoritative snapshot into localStorage. Used
 * after a successful PATCH that returns a merged payload.
 */
export function applyCloudOnboardingState(
  userId: string | null,
  snapshot: CloudOnboardingState,
): void {
  writeTourState(userId, snapshot.tour);
  // Mark the checklist as `restoredFromCloud` so the widget can suppress
  // the "you may have missed something" nudge that only makes sense on
  // the first uncached device.
  writeChecklistState(userId, {
    ...snapshot.checklist,
    restoredFromCloud: true,
  });
  writePwaState(userId, snapshot.pwa);
  writeDesktopState(userId, snapshot.desktop);
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

/**
 * Fires a single `PATCH /api/v1/users/me/onboarding` and returns the
 * merged payload (or `null` on any error). The caller decides whether
 * to write the response back into localStorage.
 *
 * Distinguishes a few failure modes silently:
 *
 *  - 404 → endpoint not shipped yet. Common today; will disappear once
 *    the backend module lands. No warning in production, dev-mode
 *    console info only.
 *  - 401 → bearer expired. The shared HTTP client already refreshes on
 *    401 with retry; a second 401 means the user is signed out. Return
 *    `null` and let the auth provider handle the redirect.
 *  - Any other error → warn in dev, silent in prod.
 */
export async function syncOnboardingStateOnce(
  userId: string | null,
): Promise<CloudOnboardingState | null> {
  if (userId === null) {
    // Anonymous / pre-auth state is localStorage-only. We can't merge
    // without an identity so there's nothing to sync.
    return null;
  }

  const payload = collectLocalOnboardingState(userId);

  try {
    // The endpoint may not exist yet — see the TODO(backend-endpoint)
    // note above.
    const merged = await httpClient.patch<CloudOnboardingState>(ONBOARDING_ENDPOINT, payload);

    if (
      merged &&
      typeof merged === "object" &&
      "tour" in merged &&
      "checklist" in merged &&
      "pwa" in merged &&
      "desktop" in merged
    ) {
      applyCloudOnboardingState(userId, merged);

      return merged;
    }

    return null;
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      // Give the developer a hint that the endpoint is missing so they
      // don't waste time debugging why cloud state isn't restoring.
      // eslint-disable-next-line no-console
      console.info(
        "[onboarding/cloud-state] sync skipped — endpoint may not be shipped yet",
        error,
      );
    }

    return null;
  }
}

// ---------------------------------------------------------------------------
// React hook — one-shot per session, mounted next to the tour provider
// ---------------------------------------------------------------------------

/**
 * Fires {@link syncOnboardingStateOnce} once per identity per session
 * on mount. Debounced by a ref so React Strict Mode's double-invoke +
 * a fast identity refresh don't fire two PATCHes.
 *
 * Mount this next to `<TourProvider>` inside the authenticated part of
 * the app so it fires only for signed-in users. Anonymous users have
 * no server state to sync.
 */
export function useCloudOnboardingSync(): void {
  const { data: identity } = useGetIdentity<Identity>();
  const userId = identity?.id ?? null;

  // A pair-of-strings tracker: `<userId>:<sessionMarker>`. The marker is
  // set on the first sync attempt for a given userId; subsequent
  // mounts for the same identity skip. A workspace switch (new userId)
  // triggers a fresh sync.
  const lastSyncedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (userId === null) {
      return;
    }

    if (lastSyncedForUser.current === userId) {
      return;
    }

    lastSyncedForUser.current = userId;

    // Fire and forget — the hook must never block a render or throw.
    void syncOnboardingStateOnce(userId);
  }, [userId]);
}
