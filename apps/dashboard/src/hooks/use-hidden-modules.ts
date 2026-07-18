/**
 * @file use-hidden-modules.ts
 * @module hooks/use-hidden-modules
 *
 * @description
 * Local-storage-backed list of module names hidden from the sidebar.
 * A hidden module is still reachable via the ⌘K command palette and
 * direct URLs — this hook only affects sidebar rendering, so users
 * who declutter their nav don't lose functionality.
 *
 * Storage layout:
 *   `academorix.sidebar.hidden` → `JSON.stringify(string[])`
 *
 * Kept structurally identical to {@link usePinnedModules} so both
 * hooks can be composed inside a single memoised filter chain
 * without callers needing to learn two shapes.
 */

import { useCallback, useEffect, useState } from "react";

/** localStorage key. Namespaced to survive schema migrations. */
const STORAGE_KEY = "academorix.sidebar.hidden";

/** Safely parse the stored list, returning `[]` on any error. */
function readStored(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;

    // WHY the runtime type-guard: JSON is user-controllable via
    // devtools; a corrupted entry should fail open (empty list),
    // never throw and break sidebar rendering.
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

/** Persist the list back to localStorage. Never throws. */
function writeStored(names: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    // Storage may be full or blocked (Safari private mode); losing
    // the persistence is the least-bad outcome — sidebar still works.
  }
}

/**
 * Return value shape. `hidden` is `readonly` so consumers can pass
 * it as a dep without accidentally mutating.
 */
export type UseHiddenModules = {
  hidden: readonly string[];
  isHidden: (name: string) => boolean;
  hide: (name: string) => void;
  unhide: (name: string) => void;
  toggle: (name: string) => void;
  clear: () => void;
};

/**
 * Returns the hidden-modules list along with a stable API. Effects
 * write on every change; the initial read is lazy through
 * `useState(readStored)` so no unnecessary re-parses happen on
 * downstream renders.
 */
export function useHiddenModules(): UseHiddenModules {
  const [hidden, setHidden] = useState<string[]>(readStored);

  useEffect(() => writeStored(hidden), [hidden]);

  const hide = useCallback((name: string) => {
    setHidden((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }, []);

  const unhide = useCallback((name: string) => {
    setHidden((prev) => prev.filter((entry) => entry !== name));
  }, []);

  const toggle = useCallback((name: string) => {
    setHidden((prev) =>
      prev.includes(name) ? prev.filter((entry) => entry !== name) : [...prev, name],
    );
  }, []);

  const isHidden = useCallback((name: string) => hidden.includes(name), [hidden]);
  const clear = useCallback(() => setHidden([]), []);

  return { hidden, isHidden, hide, unhide, toggle, clear };
}
