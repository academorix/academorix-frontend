/**
 * @file use-sidebar-group-prefs.ts
 * @module hooks/use-sidebar-group-prefs
 *
 * @description
 * Two-in-one preference store for the sidebar's canonical groups:
 *
 *   1. `order`    — a permutation of group keys that overrides the
 *                   default {@link groupOrder}. Users can move a
 *                   section up/down via the group actions dropdown;
 *                   the override is applied on top of the registry's
 *                   default order.
 *   2. `collapsed` — a set of group keys the user has toggled shut.
 *                    Collapsed groups still render their `GroupLabel`
 *                    but not their `Sidebar.Menu`, so operators can
 *                    quiet down sections they rarely touch.
 *
 * Both preferences survive reloads via localStorage but degrade
 * gracefully — a missing / malformed entry defaults to the canonical
 * order and an empty collapsed set. Kept independent from the pinned
 * and hidden modules stores so a devtools tinker on one key can't
 * corrupt another.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

/** Namespaced key for the group order override. */
const ORDER_STORAGE_KEY = "academorix.sidebar.group-order";

/**
 * Namespaced key for the collapsed-groups set.
 *
 * ## Versioning
 * The `.v2` suffix landed alongside the July 2026 taxonomy split that
 * introduced `people` / `programs` / `schedule` / `records` /
 * `communications` groups (see the docblock on `SidebarGroupKey`).
 * Bumping the key retires stored preferences that referenced the
 * legacy `operations` monolith, so returning users pick up the new
 * defaults on first load — critically, `administration` starts
 * collapsed so the daily-nav column stays uncluttered.
 */
const COLLAPSED_STORAGE_KEY = "academorix.sidebar.collapsed-groups.v2";

/**
 * Groups that start collapsed for a fresh user. Applied only when
 * the localStorage key has never been written — an explicit empty
 * write (user expanded every section then reloaded) is preserved.
 *
 * - `administration`: configuration surfaces (Users, Branches,
 *   Integrations, Attributes, Offline sync, Entitlements). Every
 *   admin task is also reachable via `/settings/*`, so hiding the
 *   group in the primary rail keeps the daily-nav column focused.
 * - `ai`: reserved bucket, empty in production tenants.
 */
const DEFAULT_COLLAPSED_GROUPS: readonly string[] = ["administration", "ai"];

/**
 * Read a stored list, distinguishing "never stored" from "stored
 * empty" so the caller can seed defaults on the fresh-user path.
 * Returns `null` when the key is absent, `[]` when the user
 * explicitly cleared it.
 */
function readStoredList(key: string): string[] | null {
  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null) return null;

    const parsed = JSON.parse(raw) as unknown;

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return null;
  }
}

/** Safe list parse — returns `[]` on any error. */
function readStringArray(key: string): string[] {
  return readStoredList(key) ?? [];
}

/** Safe list write. Silent on failure. */
function writeStringArray(key: string, values: string[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Storage failures degrade to session-only preferences.
  }
}

/**
 * Public shape returned to consumers. Every mutator is stable
 * across renders so the sidebar's memoised derivations don't
 * invalidate on every keystroke of the module filter.
 */
export type UseSidebarGroupPrefs = {
  /** Current custom order (subset / permutation of known group keys). */
  order: readonly string[];
  /** Move a group up one slot in the visible order. */
  moveGroupUp: (groupKey: string, canonicalOrder: readonly string[]) => void;
  /** Move a group down one slot in the visible order. */
  moveGroupDown: (groupKey: string, canonicalOrder: readonly string[]) => void;
  /** Reset the order to the canonical registry ordering. */
  resetOrder: () => void;
  /** Set of group keys the user has collapsed. */
  collapsed: ReadonlySet<string>;
  /** Toggle a group's collapsed state. */
  toggleCollapsed: (groupKey: string) => void;
  /** Predicate — `true` when a group is currently collapsed. */
  isCollapsed: (groupKey: string) => boolean;
};

/**
 * Apply a stored override to a canonical ordering. Any keys in the
 * override are placed first (in their stored order); anything else
 * from the canonical list is appended after, preserving canonical
 * order for keys the user has never touched. Deduplicated so a
 * corrupted store can't produce duplicate menu sections.
 */
export function applyGroupOrder(
  canonical: readonly string[],
  override: readonly string[],
): readonly string[] {
  const overriddenKnown = override.filter((key) => canonical.includes(key));
  const remaining = canonical.filter((key) => !overriddenKnown.includes(key));

  // Set + spread guarantees no duplicates even if the override array
  // was corrupted with duplicate entries (defensive; the mutators
  // below never introduce duplicates on their own).
  return Array.from(new Set([...overriddenKnown, ...remaining]));
}

/**
 * Move the given group up one slot inside the merged order. Returns
 * the new order array. Kept as a pure helper so tests / snapshots
 * can exercise the reorder logic without React.
 */
function reorderUp(current: readonly string[], groupKey: string): string[] {
  const index = current.indexOf(groupKey);

  if (index <= 0) return [...current];

  const next = [...current];

  // Standard "swap with previous" — safest reorder that never
  // reflows unrelated sections. The non-null assertions are safe:
  // `index > 0` and `index < current.length` are both guaranteed
  // by the earlier `index <= 0` guard + the copy from `current`.
  [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];

  return next;
}

/** Symmetric counterpart to {@link reorderUp}. */
function reorderDown(current: readonly string[], groupKey: string): string[] {
  const index = current.indexOf(groupKey);

  if (index < 0 || index >= current.length - 1) return [...current];

  const next = [...current];

  // Same guarantees as `reorderUp` — the guard above ensures both
  // indices are within bounds.
  [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];

  return next;
}

export function useSidebarGroupPrefs(): UseSidebarGroupPrefs {
  const [order, setOrder] = useState<string[]>(() => readStringArray(ORDER_STORAGE_KEY));
  const [collapsedList, setCollapsedList] = useState<string[]>(() => {
    // WHY the null check: `readStoredList` returns `null` when the
    // key has never been written — that's the fresh-user path
    // where we want to seed the default-collapsed groups. If the
    // key exists (even as an empty array), we honour the user's
    // stored preference verbatim.
    const stored = readStoredList(COLLAPSED_STORAGE_KEY);

    return stored ?? [...DEFAULT_COLLAPSED_GROUPS];
  });

  // Persist every change. WHY separate effects: keeps writes
  // independent so corrupting one preference can't cascade into the
  // other, and localStorage writes are amortised — the browser
  // batches them for us.
  useEffect(() => writeStringArray(ORDER_STORAGE_KEY, order), [order]);
  useEffect(() => writeStringArray(COLLAPSED_STORAGE_KEY, collapsedList), [collapsedList]);

  const collapsed = useMemo(() => new Set(collapsedList), [collapsedList]);

  const moveGroupUp = useCallback((groupKey: string, canonicalOrder: readonly string[]) => {
    setOrder((prev) => {
      const merged = applyGroupOrder(canonicalOrder, prev);

      return reorderUp(merged, groupKey);
    });
  }, []);

  const moveGroupDown = useCallback((groupKey: string, canonicalOrder: readonly string[]) => {
    setOrder((prev) => {
      const merged = applyGroupOrder(canonicalOrder, prev);

      return reorderDown(merged, groupKey);
    });
  }, []);

  const resetOrder = useCallback(() => setOrder([]), []);

  const toggleCollapsed = useCallback((groupKey: string) => {
    setCollapsedList((prev) =>
      prev.includes(groupKey) ? prev.filter((entry) => entry !== groupKey) : [...prev, groupKey],
    );
  }, []);

  const isCollapsed = useCallback((groupKey: string) => collapsed.has(groupKey), [collapsed]);

  return {
    order,
    moveGroupUp,
    moveGroupDown,
    resetOrder,
    collapsed,
    toggleCollapsed,
    isCollapsed,
  };
}
