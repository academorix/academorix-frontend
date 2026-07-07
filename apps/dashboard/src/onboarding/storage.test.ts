/**
 * @file storage.test.ts
 * @module onboarding/storage.test
 *
 * @description
 * Unit tests for the typed localStorage adapter. Covers:
 *
 *  - Default return when no payload is stored.
 *  - Round-trip write → read for every slot (tour / checklist / PWA /
 *    desktop).
 *  - Namespacing by user id — two users on the same browser don't share
 *    state.
 *  - Schema validation — a corrupt payload returns the default without
 *    throwing.
 *  - Version migration — a payload with a stale version returns the
 *    default (the fresh run is intentional).
 *  - `clearOnboardingState` removes every slot for a user.
 *
 * jsdom's `localStorage` is a real implementation, so we can exercise
 * the full write/read cycle without stubs.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type {
  ChecklistStorageState,
  DesktopStorageState,
  PwaStorageState,
  TourStorageState,
} from "@/onboarding/onboarding.types";

import { ONBOARDING_STORAGE_KEYS } from "@/config/onboarding.config";
import {
  clearOnboardingState,
  readChecklistState,
  readDesktopState,
  readPwaState,
  readTourState,
  writeChecklistState,
  writeDesktopState,
  writePwaState,
  writeTourState,
  __testables,
} from "@/onboarding/storage";

const USER_A = "user-a";
const USER_B = "user-b";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("readTourState / writeTourState", () => {
  it("returns the default when nothing is stored", () => {
    const state = readTourState(USER_A);

    expect(state.completedAt).toBeNull();
    expect(state.dismissedAt).toBeNull();
    expect(state.step).toBe(0);
    expect(state.restartedCount).toBe(0);
  });

  it("round-trips a written state", () => {
    const state: TourStorageState = {
      completedAt: "2026-01-15T12:00:00Z",
      dismissedAt: null,
      step: 3,
      restartedCount: 2,
      version: 1,
    };

    writeTourState(USER_A, state);

    expect(readTourState(USER_A)).toEqual(state);
  });

  it("returns default on corrupt JSON", () => {
    // Simulate a hand-edited localStorage — invalid JSON.
    window.localStorage.setItem(
      __testables.namespaceKey(ONBOARDING_STORAGE_KEYS.tour, USER_A),
      "not json",
    );

    const state = readTourState(USER_A);

    expect(state.completedAt).toBeNull();
  });

  it("returns default when the payload is missing a required field", () => {
    window.localStorage.setItem(
      __testables.namespaceKey(ONBOARDING_STORAGE_KEYS.tour, USER_A),
      JSON.stringify({ completedAt: null, step: 0, version: 1 }),
    );

    const state = readTourState(USER_A);

    expect(state.restartedCount).toBe(0);
  });

  it("returns default when the stored version is older than the runtime", () => {
    // A stale version means the step list materially changed; we WANT
    // to drop the state so the tour re-fires.
    window.localStorage.setItem(
      __testables.namespaceKey(ONBOARDING_STORAGE_KEYS.tour, USER_A),
      JSON.stringify({
        completedAt: "2025-01-01T00:00:00Z",
        dismissedAt: null,
        step: 3,
        restartedCount: 1,
        version: 0,
      }),
    );

    expect(readTourState(USER_A).completedAt).toBeNull();
  });
});

describe("readChecklistState / writeChecklistState", () => {
  it("round-trips checklist state", () => {
    const state: ChecklistStorageState = {
      dismissed: false,
      hidden: ["billing.setup"],
      manuallyCompleted: ["branding.customize", "safeguarding.read"],
      restoredFromCloud: true,
      version: 1,
    };

    writeChecklistState(USER_A, state);

    const read = readChecklistState(USER_A);

    expect(read.manuallyCompleted).toEqual(["branding.customize", "safeguarding.read"]);
    expect(read.hidden).toEqual(["billing.setup"]);
    expect(read.restoredFromCloud).toBe(true);
  });
});

describe("readPwaState / writePwaState", () => {
  it("round-trips PWA state", () => {
    const state: PwaStorageState = {
      firstLaunchedAt: "2026-02-01T09:00:00Z",
      tourCompletedAt: "2026-02-01T09:03:00Z",
      notificationPromptShownAt: "2026-02-01T09:03:30Z",
      version: 1,
    };

    writePwaState(USER_A, state);

    expect(readPwaState(USER_A)).toEqual(state);
  });
});

describe("readDesktopState / writeDesktopState", () => {
  it("round-trips desktop state", () => {
    const state: DesktopStorageState = {
      welcomeShownAt: "2026-03-01T09:00:00Z",
      shortcutCoachmarkShownAt: null,
      updaterOptedInAt: "2026-03-01T09:01:00Z",
      version: 1,
    };

    writeDesktopState(USER_A, state);

    expect(readDesktopState(USER_A)).toEqual(state);
  });
});

describe("namespacing by user id", () => {
  it("two users on the same browser have independent state", () => {
    writeTourState(USER_A, {
      completedAt: "2026-01-01T00:00:00Z",
      dismissedAt: null,
      step: 3,
      restartedCount: 0,
      version: 1,
    });
    writeTourState(USER_B, {
      completedAt: null,
      dismissedAt: null,
      step: 0,
      restartedCount: 0,
      version: 1,
    });

    expect(readTourState(USER_A).completedAt).toBe("2026-01-01T00:00:00Z");
    expect(readTourState(USER_B).completedAt).toBeNull();
  });

  it("null user id falls back to the 'anon' bucket", () => {
    writeTourState(null, {
      completedAt: "2026-01-01T00:00:00Z",
      dismissedAt: null,
      step: 0,
      restartedCount: 0,
      version: 1,
    });

    expect(readTourState(undefined).completedAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("clearOnboardingState", () => {
  it("removes every slot for a user", () => {
    writeTourState(USER_A, {
      completedAt: "2026-01-01T00:00:00Z",
      dismissedAt: null,
      step: 0,
      restartedCount: 0,
      version: 1,
    });
    writeChecklistState(USER_A, {
      dismissed: true,
      hidden: [],
      manuallyCompleted: [],
      restoredFromCloud: false,
      version: 1,
    });
    writePwaState(USER_A, {
      firstLaunchedAt: "2026-02-01T09:00:00Z",
      tourCompletedAt: null,
      notificationPromptShownAt: null,
      version: 1,
    });
    writeDesktopState(USER_A, {
      welcomeShownAt: "2026-03-01T09:00:00Z",
      shortcutCoachmarkShownAt: null,
      updaterOptedInAt: null,
      version: 1,
    });

    clearOnboardingState(USER_A);

    expect(readTourState(USER_A).completedAt).toBeNull();
    expect(readChecklistState(USER_A).dismissed).toBe(false);
    expect(readPwaState(USER_A).firstLaunchedAt).toBeNull();
    expect(readDesktopState(USER_A).welcomeShownAt).toBeNull();
  });

  it("leaves other users' state untouched", () => {
    writeTourState(USER_A, {
      completedAt: "2026-01-01T00:00:00Z",
      dismissedAt: null,
      step: 0,
      restartedCount: 0,
      version: 1,
    });
    writeTourState(USER_B, {
      completedAt: "2026-01-02T00:00:00Z",
      dismissedAt: null,
      step: 0,
      restartedCount: 0,
      version: 1,
    });

    clearOnboardingState(USER_A);

    expect(readTourState(USER_A).completedAt).toBeNull();
    expect(readTourState(USER_B).completedAt).toBe("2026-01-02T00:00:00Z");
  });
});
