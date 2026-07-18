/**
 * @file persisted-view.ts
 * @module lib/persisted-view
 *
 * @description
 * Tiny localStorage helper for persisting the active saved view + active
 * filter chip ids on a per-resource basis. Keeps `ResourceGrid` state
 * hydrated across reloads so users don't lose their listing preferences.
 */

const STORAGE_KEY = "academorix.resource.view.v1";

type PersistedState = {
  view: string;
  chipIds: string[];
};

type StoreShape = Record<string, PersistedState>;

function readStore(): StoreShape {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;

    if (!raw) return {};
    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object" ? (parsed as StoreShape) : {};
  } catch {
    return {};
  }
}

function writeStore(store: StoreShape): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  } catch {
    // ignore quota / access errors
  }
}

/** Read the persisted state for `resource`, or `undefined` if none saved yet. */
export function readPersistedView(resource: string): PersistedState | undefined {
  const store = readStore();

  return store[resource];
}

/** Persist the current view + chip ids for `resource`. */
export function writePersistedView(resource: string, state: PersistedState): void {
  const store = readStore();

  writeStore({ ...store, [resource]: state });
}

/** Clear persisted state for `resource`. */
export function clearPersistedView(resource: string): void {
  const store = readStore();

  if (!(resource in store)) return;
  const next: StoreShape = { ...store };

  delete next[resource];
  writeStore(next);
}
