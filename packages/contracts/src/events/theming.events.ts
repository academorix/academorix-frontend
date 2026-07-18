/**
 * @file theming.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/theming` on the
 *   `EVENT_EMITTER` bus.
 *
 *   Constants live in contracts so cross-package consumers (analytics,
 *   dashboards, SDUI runtime, brand-switch scoping) can subscribe
 *   without depending on the theming runtime.
 */

/**
 * Theming lifecycle event names.
 */
export const THEMING_EVENTS = {
  /**
   * The user-selected mode (or the resolved mode driven by the OS)
   * changed. Payload: `{ mode: ColorMode; resolvedMode: ResolvedMode;
   * previous: ColorMode | ResolvedMode; source: 'user' | 'system' }`.
   */
  MODE_CHANGED: "theming.mode-changed",

  /**
   * A named theme preset was activated. Payload: `{ themeId: string;
   * previous: string }`.
   */
  THEME_ACTIVATED: "theming.theme-activated",

  /**
   * A theme preset was registered with the `ThemeRegistry`. Payload:
   * `{ themeId: string; source: IThemeConfig }`.
   */
  THEME_REGISTERED: "theming.theme-registered",

  /**
   * The active token snapshot changed (mode or theme swap). Payload:
   * `{ themeId: string; mode: ResolvedMode }`.
   */
  TOKENS_CHANGED: "theming.tokens-changed",

  /**
   * Persisted state was restored on module init. Payload:
   * `{ themeId: string; mode: ColorMode; resolvedMode: ResolvedMode }`.
   */
  STATE_RESTORED: "theming.state-restored",

  /**
   * The remote preset catalog was fetched (initial load or refresh).
   * Payload: `{ count: number }`.
   */
  PRESETS_LOADED: "theming.presets-loaded",

  /**
   * A remote preset load failed. Payload: `{ error: Error }`.
   */
  PRESETS_LOAD_FAILED: "theming.presets-load-failed",

  /**
   * A remote preset was applied via the API. Payload:
   * `{ name: string }`.
   */
  PRESET_APPLIED: "theming.preset-applied",
} as const;

/** Union type of every emitted theming event name. */
export type ThemingEventName = (typeof THEMING_EVENTS)[keyof typeof THEMING_EVENTS];
