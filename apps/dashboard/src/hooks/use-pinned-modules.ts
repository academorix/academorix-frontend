/**
 * @file use-pinned-modules.ts
 * @module hooks/use-pinned-modules
 *
 * @description
 * Local-storage-backed list of pinned module names. Sidebar renders pinned
 * items in a dedicated top section so operators can promote the modules they
 * touch daily.
 */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "academorix.sidebar.pinned";

function readStored(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeStored(names: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    // ignore
  }
}

export type UsePinnedModules = {
  pinned: readonly string[];
  isPinned: (name: string) => boolean;
  toggle: (name: string) => void;
  clear: () => void;
};

/** Returns the pinned-modules list along with a stable API to mutate it. */
export function usePinnedModules(): UsePinnedModules {
  const [pinned, setPinned] = useState<string[]>(readStored);

  useEffect(() => writeStored(pinned), [pinned]);

  const toggle = useCallback((name: string) => {
    setPinned((prev) =>
      prev.includes(name) ? prev.filter((entry) => entry !== name) : [...prev, name],
    );
  }, []);

  const isPinned = useCallback((name: string) => pinned.includes(name), [pinned]);
  const clear = useCallback(() => setPinned([]), []);

  return { pinned, isPinned, toggle, clear };
}
