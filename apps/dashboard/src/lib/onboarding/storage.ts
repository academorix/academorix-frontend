/**
 * @file storage.ts
 * @module onboarding/storage
 *
 * @description
 * Typed localStorage adapter for every onboarding state slot (tour,
 * checklist, PWA, desktop). Wraps `window.localStorage` in a
 * schema-validated read/write API so a corrupt payload (a stale
 * schema version, an object with a missing field, a value someone
 * hand-edited in DevTools) can never crash the runtime — the adapter
 * returns the shape's default when validation fails.
 *
 * ## Why zod?
 *
 * The dashboard already ships zod for env validation
 * (`@/config/env.config`) so we get schema validation for free. Zod
 * catches:
 *
 * 1. Type drift — the state was written under an older schema that
 *    added or removed a field.
 * 2. Corruption — the state is not JSON or is a JSON scalar rather
 *    than an object.
 * 3. Hand-editing — a curious developer flipped `dismissed: true` to
 *    `dismissed: "true"` in DevTools.
 *
 * ## Version migration
 *
 * Every payload carries `version`. If the stored version is older than
 * {@link ONBOARDING_SCHEMA_VERSION}, we drop the payload and return the
 * default. This is deliberately destructive — a schema change means
 * the step list changed materially, and we WANT the affected users to
 * re-run the tour or re-check the checklist. When the migration story
 * gets more nuanced (Phase 3+), we can grow a per-slot migration
 * pipeline in this file without changing the callers.
 *
 * ## SSR / non-browser safety
 *
 * `typeof window === "undefined"` returns the default without touching
 * localStorage. Also handles Safari-private-mode quota exceptions and
 * cross-origin `SecurityError` throws.
 *
 * @see ONBOARDING_PLAN.md §4.3, §5.2, §6, §7.
 */

import { z } from "zod";

import type {
  ChecklistStorageState,
  DesktopStorageState,
  PwaStorageState,
  TourStorageState,
} from "@/onboarding/onboarding.types";

import { ONBOARDING_SCHEMA_VERSION, ONBOARDING_STORAGE_KEYS } from "@/config/onboarding.config";
import {
  DEFAULT_CHECKLIST_STATE,
  DEFAULT_DESKTOP_STATE,
  DEFAULT_PWA_STATE,
  DEFAULT_TOUR_STATE,
} from "@/onboarding/onboarding.types";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

/**
 * Tour state schema. `version` accepts any positive integer at read
 * time; the migration check below drops payloads whose version doesn't
 * match {@link ONBOARDING_SCHEMA_VERSION}.
 */
const tourSchema = z.object({
  completedAt: z.string().nullable(),
  dismissedAt: z.string().nullable(),
  step: z.number().int().min(0),
  restartedCount: z.number().int().min(0),
  version: z.number().int().positive(),
});

/** Checklist state schema. */
const checklistSchema = z.object({
  dismissed: z.boolean(),
  hidden: z.array(z.string()),
  manuallyCompleted: z.array(z.string()),
  restoredFromCloud: z.boolean(),
  version: z.number().int().positive(),
});

/** PWA state schema. */
const pwaSchema = z.object({
  firstLaunchedAt: z.string().nullable(),
  tourCompletedAt: z.string().nullable(),
  notificationPromptShownAt: z.string().nullable(),
  version: z.number().int().positive(),
});

/** Desktop state schema. */
const desktopSchema = z.object({
  welcomeShownAt: z.string().nullable(),
  shortcutCoachmarkShownAt: z.string().nullable(),
  updaterOptedInAt: z.string().nullable(),
  version: z.number().int().positive(),
});

// ---------------------------------------------------------------------------
// Namespacing
// ---------------------------------------------------------------------------

/**
 * Namespaces a storage key by user id so switching accounts on the
 * same browser doesn't leak state. Falls back to `"anon"` for the
 * pre-auth window (the login page + the immediate post-signup redirect).
 */
function namespaceKey(baseKey: string, userId: string | null | undefined): string {
  return `${baseKey}:${userId ?? "anon"}`;
}

// ---------------------------------------------------------------------------
// Generic read / write
// ---------------------------------------------------------------------------

/**
 * Reads a typed payload from `localStorage`. Silent on any error — a
 * missing / corrupt / version-mismatched payload returns the caller's
 * default so the runtime never sees `null`.
 *
 * @param key - The base storage key (from {@link ONBOARDING_STORAGE_KEYS}).
 * @param userId - Identity id used to namespace the payload.
 * @param schema - Zod schema for validation.
 * @param defaultValue - What to return when nothing valid is stored.
 */
function read<T>(
  key: string,
  userId: string | null | undefined,
  schema: z.ZodSchema<T>,
  defaultValue: T,
): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const raw = window.localStorage.getItem(namespaceKey(key, userId));

    if (raw === null) {
      return defaultValue;
    }

    const parsed = JSON.parse(raw) as unknown;
    const result = schema.safeParse(parsed);

    // Invalid payload → treat as fresh. Log in dev so the fix is
    // obvious the next time a dev opens the tab; silent in prod.
    if (!result.success) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[onboarding] invalid payload for ${key}; using default`, result.error);
      }

      return defaultValue;
    }

    // Version migration — drop payloads with the wrong schema version.
    // We compare against the runtime constant so bumping it in one place
    // invalidates every stale slot.
    const versioned = result.data as unknown as { version: number };

    if (versioned.version !== ONBOARDING_SCHEMA_VERSION) {
      return defaultValue;
    }

    return result.data;
  } catch (error) {
    // JSON.parse threw, localStorage threw (SecurityError, private mode).
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[onboarding] read failed for ${key}`, error);
    }

    return defaultValue;
  }
}

/**
 * Writes a typed payload to `localStorage`. Silent on quota / access
 * errors — the runtime always has the in-memory state to fall back on,
 * so a failed persist just means the value won't survive a reload.
 */
function write<T>(key: string, userId: string | null | undefined, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(namespaceKey(key, userId), JSON.stringify(value));
  } catch (error) {
    // Silent — Safari private mode + full quota both throw here. The
    // in-memory state stays intact.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[onboarding] write failed for ${key}`, error);
    }
  }
}

/** Removes a storage slot entirely. Used by `clearOnboardingState`. */
function remove(key: string, userId: string | null | undefined): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(namespaceKey(key, userId));
  } catch {
    // Silent — same reasoning as `write`.
  }
}

// ---------------------------------------------------------------------------
// Public API — per-slot accessors
// ---------------------------------------------------------------------------

/**
 * Read the tour state for a given user. Returns
 * {@link DEFAULT_TOUR_STATE} when nothing is stored or the payload is
 * invalid / stale.
 */
export function readTourState(userId: string | null | undefined): TourStorageState {
  return read(ONBOARDING_STORAGE_KEYS.tour, userId, tourSchema, DEFAULT_TOUR_STATE);
}

/** Persist the tour state. */
export function writeTourState(userId: string | null | undefined, state: TourStorageState): void {
  write(ONBOARDING_STORAGE_KEYS.tour, userId, state);
}

/** Read the checklist state for a given user. */
export function readChecklistState(userId: string | null | undefined): ChecklistStorageState {
  return read(ONBOARDING_STORAGE_KEYS.checklist, userId, checklistSchema, DEFAULT_CHECKLIST_STATE);
}

/** Persist the checklist state. */
export function writeChecklistState(
  userId: string | null | undefined,
  state: ChecklistStorageState,
): void {
  write(ONBOARDING_STORAGE_KEYS.checklist, userId, state);
}

/** Read the PWA state for a given user. */
export function readPwaState(userId: string | null | undefined): PwaStorageState {
  return read(ONBOARDING_STORAGE_KEYS.pwa, userId, pwaSchema, DEFAULT_PWA_STATE);
}

/** Persist the PWA state. */
export function writePwaState(userId: string | null | undefined, state: PwaStorageState): void {
  write(ONBOARDING_STORAGE_KEYS.pwa, userId, state);
}

/** Read the desktop state for a given user. */
export function readDesktopState(userId: string | null | undefined): DesktopStorageState {
  return read(ONBOARDING_STORAGE_KEYS.desktop, userId, desktopSchema, DEFAULT_DESKTOP_STATE);
}

/** Persist the desktop state. */
export function writeDesktopState(
  userId: string | null | undefined,
  state: DesktopStorageState,
): void {
  write(ONBOARDING_STORAGE_KEYS.desktop, userId, state);
}

// ---------------------------------------------------------------------------
// Bulk operations
// ---------------------------------------------------------------------------

/**
 * Clears every onboarding slot for a given user. Used by
 * `restartTour()` and by the "Reset onboarding" developer command
 * (dev-only) so a maintainer can rerun the tour on demand.
 */
export function clearOnboardingState(userId: string | null | undefined): void {
  remove(ONBOARDING_STORAGE_KEYS.tour, userId);
  remove(ONBOARDING_STORAGE_KEYS.checklist, userId);
  remove(ONBOARDING_STORAGE_KEYS.pwa, userId);
  remove(ONBOARDING_STORAGE_KEYS.desktop, userId);
}

/**
 * Test-only: exposes the internal `namespaceKey` helper so tests can
 * assert the exact key format without duplicating the string.
 *
 * @internal
 */
export const __testables = {
  namespaceKey,
};
