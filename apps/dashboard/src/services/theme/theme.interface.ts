/**
 * @file theme.interface.ts
 * @module @academorix/dashboard/services/theme
 * @description Reactive snapshot shape emitted by {@link ThemeService}.
 *
 *   Kept as a plain interface (no methods) so React consumers can compare
 *   snapshots by structural equality without accidentally triggering an
 *   external-store re-render. Method mutators live on the service and are
 *   read separately via `useInject(THEME_SERVICE)`.
 */

import type { ResolvedThemeMode, ThemeMode, ThemeToken } from "@/lib/theme";

/**
 * Immutable snapshot of the current theme state. `ThemeService.getSnapshot()`
 * returns this shape; consumers subscribe via `useSyncExternalStore` for
 * reactive reads.
 */
export interface IThemeSnapshot {
  /** The user's selected mode — one of `"light"` / `"dark"` / `"system"`. */
  readonly mode: ThemeMode;
  /**
   * The mode resolved through the OS query — when `mode === "system"` this
   * is whichever appearance the OS currently exposes; otherwise identical
   * to `mode`.
   */
  readonly resolvedMode: ResolvedThemeMode;
  /**
   * The `data-theme` value applied to `<html>`. Always equal to
   * `resolvedMode`; exposed separately so consumers can render "the active
   * theme token" without importing the resolver.
   */
  readonly token: ThemeToken;
}
