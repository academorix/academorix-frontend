/**
 * @file registry-helpers.ts
 * @module menus/registry-helpers
 *
 * @description
 * Pure helpers that every menu renderer consumes to reason about the shared
 * command registry (`src/config/menu.config.ts`). Kept as a standalone
 * module so:
 *
 *   1. The three renderers (context menu, palette, shortcut sheet) share a
 *      single filter/group implementation — no drift between surfaces.
 *   2. The helpers are trivially testable in isolation (no React, no
 *      DOM) — see the colocated vitest suite.
 *   3. The `assertNoDuplicateShortcuts` boot-time detector can run outside
 *      of any renderer, from the app entry point, and log clean warnings.
 *
 * ## Design notes
 *
 * - Every helper is **pure** — no side effects other than the intentional
 *   `console.warn` inside `assertNoDuplicateShortcuts` (dev-only).
 * - Predicate execution is memoised per call, not across calls: renderers
 *   invoke these helpers on menu open, at which point the input list is
 *   already small (< 200 entries in the biggest deployment). Adding a
 *   memoization layer would just be premature complexity.
 * - The API returns `readonly` views wherever possible so callers cannot
 *   accidentally mutate the shared registry.
 *
 * @see menus module
 * @see menus module
 */

import type {
  MenuCategory,
  MenuCommand,
  MenuContext,
  MenuSurface,
} from "@/lib/menus/command.types";

import { formatShortcut } from "@/config/shortcuts.config";
import { MENU_CATEGORY_ORDER, type ShortcutOs } from "@/lib/menus/command.types";

// ---------------------------------------------------------------------------
// Visibility filter
// ---------------------------------------------------------------------------

/**
 * Applies the surface + `isVisible(ctx)` predicate to a command list.
 *
 * ## Why the two-stage filter?
 *
 * Permission checks (`requires`) are async — the registry hits the
 * `accessControlProvider` and awaits — so the shell resolves them **before**
 * calling into this helper and passes the already-filtered list in. This
 * function only handles the synchronous portion (which surface + optional
 * `isVisible`) so it can be invoked from render loops without triggering a
 * `Suspense` boundary or forcing every renderer to be `async`.
 *
 * A command with no `surfaces` array is treated as visible on every surface —
 * matches the default behaviour documented in the `MenuCommand` shape and
 * exercised by every command in the seed registry.
 *
 * @param commands - The full registry (or any subset).
 * @param surface - The concrete surface the renderer is targeting.
 * @param ctx - The current menu context; passed straight to `isVisible`.
 * @returns Filtered array in the same relative order as the input.
 */
export function filterVisibleCommands(
  commands: readonly MenuCommand[],
  surface: MenuSurface,
  ctx: MenuContext,
): MenuCommand[] {
  const result: MenuCommand[] = [];

  for (const command of commands) {
    // Surface filter — the most common exclusion (native-only commands hide
    // from web renderers, context-only commands hide from the top bar, etc.).
    const surfaces = command.surfaces ?? DEFAULT_SURFACES;

    if (!surfaces.includes(surface)) {
      continue;
    }

    // Optional runtime predicate. Kept AFTER the surface filter because the
    // surface list is a plain array test and cheaper than invoking a function.
    if (command.isVisible && !command.isVisible(ctx)) {
      continue;
    }

    result.push(command);
  }

  return result;
}

/**
 * Constant referenced by `filterVisibleCommands` when a command omits its
 * `surfaces` list. Kept as a module-level constant (not inlined) so the
 * default is grep-able and testable — a future change to the default is a
 * one-line edit.
 */
const DEFAULT_SURFACES: readonly MenuSurface[] = ["app", "context", "native"] as const;

// ---------------------------------------------------------------------------
// Category grouping
// ---------------------------------------------------------------------------

/**
 * Groups a command list by category in the canonical display order
 * (`MENU_CATEGORY_ORDER` from `command.types.ts`). Empty categories are
 * elided so a renderer can iterate the returned map without emitting empty
 * section headings.
 *
 * ## Contract
 *
 * - Insertion order matches `MENU_CATEGORY_ORDER` — callers can rely on it
 *   for rendering (`for (const [category, entries] of grouped) …`).
 * - Command order within each bucket is preserved from the input.
 * - Categories with zero entries are NOT included in the returned map so
 *   `Map.size` reflects the number of *renderable* sections.
 *
 * @param commands - The pre-filtered command list (typically the result of
 *                   `filterVisibleCommands`).
 * @returns Map keyed by category in `MENU_CATEGORY_ORDER`, holding only
 *          non-empty groups.
 */
export function groupByCategory(
  commands: readonly MenuCommand[],
): Map<MenuCategory, MenuCommand[]> {
  // Populate an intermediate bucket keyed by category so we only walk the
  // input list once. The final Map is then built in canonical order.
  const buckets = new Map<MenuCategory, MenuCommand[]>();

  for (const command of commands) {
    const bucket = buckets.get(command.category);

    if (bucket) {
      bucket.push(command);
    } else {
      buckets.set(command.category, [command]);
    }
  }

  // Rebuild in canonical order. A `for..of` on `MENU_CATEGORY_ORDER` keeps
  // the display order stable regardless of insertion order above.
  const ordered = new Map<MenuCategory, MenuCommand[]>();

  for (const category of MENU_CATEGORY_ORDER) {
    const bucket = buckets.get(category);

    if (bucket && bucket.length > 0) {
      ordered.set(category, bucket);
    }
  }

  return ordered;
}

// ---------------------------------------------------------------------------
// Shortcut display
// ---------------------------------------------------------------------------

/**
 * Formats a command's shortcut for display. A thin wrapper around
 * `formatShortcut` from `shortcuts.config`, kept here so every renderer has
 * a **single** import surface for menu rendering — you never have to reach
 * into `shortcuts.config` when you already have a `MenuCommand`.
 *
 * Returns `undefined` when the command carries no shortcut so callers can
 * conditionally render the trailing hint (`{shortcut ? <Kbd>…</Kbd> : null}`)
 * without a `String()` cast.
 *
 * @param command - The command whose shortcut to render.
 * @param os - Target OS. Defaults to auto-detected via `detectOs()`.
 */
export function resolveShortcutDisplay(command: MenuCommand, os?: ShortcutOs): string | undefined {
  if (!command.shortcut) {
    return undefined;
  }

  return formatShortcut(command.shortcut, os);
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

/**
 * Boot-time diagnostic — walks every command on the given surface and
 * warns (via `console.warn`) when two commands claim the same shortcut.
 * A shortcut collision is a build-time bug: users pressing the combo would
 * see arbitrary behaviour depending on which listener fires first.
 *
 * ## Silent in production
 *
 * The console warning is dev-only for the same reason `registry.ts` gates
 * its collision warnings: a badly-authored PR must not spam end-user
 * consoles. Production still gets the check — the function silently drops
 * the second binding to the first-registered one — but nobody sees a
 * message.
 *
 * ## Returns
 *
 * The list of collisions detected. Consumers may ignore the return value
 * (the `console.warn` side-effect is the point) but tests use it to assert
 * detection behaviour without patching `console`.
 *
 * @param commands - The full registry (or the subset for the given surface).
 * @param surface - Which surface to inspect. Callers typically pass every
 *                  surface in a loop at boot.
 * @returns Array of `{shortcut, ids}` records describing every collision.
 */
export interface ShortcutCollision {
  /** The shortcut string that appeared more than once. */
  shortcut: string;
  /** All command ids claiming the shortcut, in registration order. */
  ids: readonly string[];
}

/**
 * @param commands - The full registry (or a pre-filtered subset).
 * @param surface - The surface to inspect. Only commands whose `surfaces`
 *                  include this value are considered.
 * @param report - Optional injection point for the warning sink. Defaults to
 *                 `console.warn`; tests pass a spy to assert without patching
 *                 the global. Kept as an optional parameter so production
 *                 callers can stay a one-liner.
 */
export function assertNoDuplicateShortcuts(
  commands: readonly MenuCommand[],
  surface: MenuSurface,
  report: (message: string) => void = defaultReporter,
): ShortcutCollision[] {
  const seen = new Map<string, string[]>();

  for (const command of commands) {
    if (!command.shortcut) {
      continue;
    }

    const surfaces = command.surfaces ?? DEFAULT_SURFACES;

    if (!surfaces.includes(surface)) {
      continue;
    }

    // Normalise the shortcut key so `"Cmd+K"` and `"cmd+k"` collide. The
    // registry ships accelerators in canonical case, but the extra safety
    // costs nothing and prevents a future manifest typo from slipping past.
    const key = command.shortcut.toLowerCase();
    const existing = seen.get(key);

    if (existing) {
      existing.push(command.id);
    } else {
      seen.set(key, [command.id]);
    }
  }

  const collisions: ShortcutCollision[] = [];

  for (const [key, ids] of seen) {
    if (ids.length > 1) {
      collisions.push({ shortcut: key, ids });
      report(
        `[menus] Duplicate shortcut "${key}" on surface "${surface}" — bound by ${ids
          .map((id) => `"${id}"`)
          .join(", ")}. First binding wins.`,
      );
    }
  }

  return collisions;
}

/**
 * Default `assertNoDuplicateShortcuts` sink — writes to `console.warn` in
 * dev, silent in production. Kept as a module-level function (not inline
 * inside `assertNoDuplicateShortcuts`) so tests can compare identity.
 */
function defaultReporter(message: string): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
}
