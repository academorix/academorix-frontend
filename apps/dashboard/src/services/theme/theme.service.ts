/**
 * @file theme.service.ts
 * @module @academorix/dashboard/services/theme
 * @description Container-owned theme controller.
 *
 *   Owns the user's mode selection (`light` / `dark` / `system`), resolves
 *   the `system` mode against the OS media query, persists the selection to
 *   `localStorage`, and paints `data-theme` + `.light|.dark` classes onto
 *   `<html>`.
 *
 *   ## Migration note
 *
 *   Replaces the legacy `<ThemeProvider>` context in
 *   `apps/dashboard/src/providers/theme-provider.tsx`. React consumers now
 *   read state via `useTheme()` (see `services/theme/use-theme.hook.ts`) —
 *   the hook returns the same shape the provider used to expose, so no
 *   consumer needs an API change.
 *
 *   ## Why a service and not a hook
 *
 *   The theme is an app-wide singleton — every subtree sees the same value,
 *   never a tree-scoped one. That's the Lane 1 (DI) case per
 *   `.kiro/steering/communication-patterns.md`: a container-owned state
 *   store subscribed via `useSyncExternalStore`, not a React context.
 */

import { Injectable, type OnApplicationShutdown, type OnModuleInit } from "@stackra/container";

import type { IThemeSnapshot } from "./theme.interface";
import type { ResolvedThemeMode, ThemeMode, ThemeToken } from "@/lib/theme";

import {
  applyTheme,
  detectSystemAppearance,
  readStoredMode,
  toThemeToken,
  writeStoredMode,
} from "@/lib/theme-utils";

/**
 * Reactive theme controller.
 *
 * Reads the persisted mode + the OS appearance during `onModuleInit`,
 * paints the theme on `<html>`, and subscribes to the OS media query so
 * `mode === "system"` re-resolves live. Listeners register via
 * {@link ThemeService.subscribe} and read the current snapshot via
 * {@link ThemeService.getSnapshot}.
 *
 * @example
 * ```tsx
 * // Inside a React component:
 * const theme = useInject<ThemeService>(THEME_SERVICE);
 * const { mode, resolvedMode, token } = useSyncExternalStore(
 *   theme.subscribe,
 *   theme.getSnapshot,
 *   theme.getSnapshot,
 * );
 * ```
 */
@Injectable()
export class ThemeService implements OnModuleInit, OnApplicationShutdown {
  /** Current mode + resolved values. Mutated only via {@link setMode}. */
  #snapshot: IThemeSnapshot;

  /** Reactive listeners. Iterated on every mutation. */
  readonly #listeners = new Set<() => void>();

  /** Unsubscriber for the `(prefers-color-scheme: dark)` listener. */
  #osAppearanceCleanup: (() => void) | null = null;

  public constructor() {
    // Seed with a stable initial snapshot so `getSnapshot()` is safe to
    // call before `onModuleInit` — services can be resolved during graph
    // construction in tests.
    const mode = readStoredMode();

    this.#snapshot = ThemeService.#buildSnapshot(mode);
  }

  /**
   * Fired once by the container after the module graph resolves. Paints
   * the initial theme onto `<html>` and installs the OS appearance
   * listener so `mode === "system"` re-resolves live.
   *
   * The `applyTheme` call is idempotent — re-running is safe if the
   * container is torn down + rebuilt during hot-reload.
   */
  public onModuleInit(): void {
    applyTheme(this.#snapshot.token);
    this.#installOsAppearanceListener();
  }

  /**
   * Fired when the container tears down. Detaches the OS appearance
   * listener so the service leaves no dangling subscribers. Idempotent.
   */
  public onApplicationShutdown(): void {
    this.#osAppearanceCleanup?.();
    this.#osAppearanceCleanup = null;
    this.#listeners.clear();
  }

  /**
   * Subscribe to snapshot changes. Returns an unsubscriber suitable for
   * `useSyncExternalStore` cleanup.
   *
   * The handler bound to a React fiber runs during `useSyncExternalStore`'s
   * commit — never in an effect — so notifying multiple times per tick is
   * a no-op after the first re-render is queued.
   *
   * @param listener - Callback invoked on every mutation.
   * @returns Unsubscriber.
   */
  public readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);

    return (): void => {
      this.#listeners.delete(listener);
    };
  };

  /**
   * Current theme snapshot — returns the same object identity until a
   * mutation queues a new snapshot. Required stability for
   * `useSyncExternalStore`.
   */
  public readonly getSnapshot = (): IThemeSnapshot => this.#snapshot;

  /**
   * Update the active mode. Persists to `localStorage`, re-resolves the
   * token, paints `<html>`, and notifies subscribers.
   *
   * A no-op when `mode` already matches — this keeps subscribers from
   * re-rendering after redundant writes (e.g. a menu re-picking the same
   * entry).
   *
   * @param mode - The new mode; one of `"light"` / `"dark"` / `"system"`.
   */
  public readonly setMode = (mode: ThemeMode): void => {
    if (this.#snapshot.mode === mode) {
      return;
    }

    writeStoredMode(mode);
    this.#snapshot = ThemeService.#buildSnapshot(mode);
    applyTheme(this.#snapshot.token);
    this.#emit();
  };

  /**
   * Install a `(prefers-color-scheme: dark)` listener that re-resolves the
   * snapshot when the OS appearance changes while `mode === "system"`.
   *
   * The listener runs in `onModuleInit` — deferred from the constructor so
   * the service can be constructed in Node test environments without a
   * DOM. Non-browser runtimes (jsdom without `matchMedia`, SSR) fall
   * through cleanly via {@link detectSystemAppearance}'s `undefined`
   * check.
   */
  #installOsAppearanceListener(): void {
    // Guard for SSR + old jsdom — the media query API isn't universally
    // available. `subscribeToOsAppearance` in the legacy provider does
    // the same guard; we match its semantics here.
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (): void => {
      // Only care about the OS appearance flip when the user is on
      // `system`. On an explicit `light` / `dark` selection the OS query
      // is irrelevant; skipping the mutation avoids a spurious re-render.
      if (this.#snapshot.mode !== "system") {
        return;
      }

      const next = ThemeService.#buildSnapshot("system");

      // Same-token guard — some browsers fire `change` when the query
      // resolves the same value (matched-media transitions vs deltas).
      if (next.token === this.#snapshot.token) {
        return;
      }

      this.#snapshot = next;
      applyTheme(this.#snapshot.token);
      this.#emit();
    };

    query.addEventListener("change", onChange);
    this.#osAppearanceCleanup = (): void => query.removeEventListener("change", onChange);
  }

  /**
   * Notify every registered subscriber. Errors thrown by a subscriber are
   * NOT swallowed — a subscriber that throws is a bug the developer
   * should surface, not a fail-soft path.
   */
  #emit(): void {
    for (const listener of this.#listeners) {
      listener();
    }
  }

  /**
   * Build a fresh snapshot for the given mode. Resolves `system` against
   * the OS query so downstream consumers only see the concrete
   * `resolvedMode` / `token`.
   *
   * Static so it can run before the constructor has finished — the
   * constructor uses it to seed `#snapshot`.
   *
   * @param mode - Raw user selection.
   * @returns Immutable snapshot with `mode` + resolved counterparts.
   */
  static #buildSnapshot(mode: ThemeMode): IThemeSnapshot {
    const resolvedMode: ResolvedThemeMode = mode === "system" ? detectSystemAppearance() : mode;
    const token: ThemeToken = toThemeToken(mode);

    return { mode, resolvedMode, token };
  }
}
