/**
 * @file theming.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the theming subsystem.
 *
 *   The theming package holds every theme (built-ins + `forFeature`
 *   contributions + API-fetched, when configured) in a single
 *   `ThemeRegistry`. Reactive theme state lives in
 *   `ACTIVE_THEME_STORE` (registered by the app via
 *   `StateModule.forFeature`).
 *
 *   - `THEME_BINDINGS`         — platform adapter (DOM / native).
 *   - `THEMING_CONFIG`         — merged `IThemingModuleOptions`.
 *   - `THEME_REGISTRY`         — the theme catalog (facade over
 *                                `Store<readonly ITheme[]>`).
 *   - `THEME_SERVICE`          — client orchestrator (mode + active
 *                                theme + optional API bootstrap).
 *   - `THEMES_STORE`           — the underlying reactive catalog
 *                                store; consumers use it with
 *                                `useSelector` for reactive reads.
 *   - `ACTIVE_THEME_STORE`     — reactive `{ id, mode, resolvedMode }`.
 */

/** Token for the runtime `IThemeBindings` implementation (web / native). */
export const THEME_BINDINGS = Symbol.for("THEME_BINDINGS");

/** Token for the merged `IThemingModuleOptions`. */
export const THEMING_CONFIG = Symbol.for("THEMING_CONFIG");

/**
 * Token for the `IThemeRegistry` — the theme catalog. Seeded with
 * `BUILT_IN_THEMES` on module init, extended by `forFeature`
 * contributions, and merged with API-fetched themes on
 * `onApplicationBootstrap` when `config.api` is set.
 */
export const THEME_REGISTRY = Symbol.for("THEME_REGISTRY");

/**
 * Token for the `IThemeService` — client-only orchestrator (mode
 * resolution, active-theme setter, system-preference subscription,
 * optional API bootstrap fetch).
 */
export const THEME_SERVICE = Symbol.for("THEME_SERVICE");

/**
 * Token for the underlying `Store<readonly ITheme[]>` that
 * `ThemeRegistry` wraps. Consumers who need reactive reads of the
 * full catalog use `useSelector(THEMES_STORE, s => s)` in React.
 *
 * @remarks Bound internally by `ThemingModule.forRoot` — apps do
 *   NOT need to register this via `StateModule.forFeature`. It's
 *   an ordinary in-memory `Store` with no persistence, no cross-tab
 *   broadcaster, no realtime broadcaster.
 */
export const THEMES_STORE = Symbol.for("THEMES_STORE");

/**
 * Token for the reactive `Store<IActiveThemeState>` holding the
 * currently-active theme id + color mode + resolved mode.
 *
 * @remarks Bound by the app via
 *   `StateModule.forFeature({ token: ACTIVE_THEME_STORE, persistence: 'localStorage', crossTab: true })`.
 *   Persistence + cross-tab sync flow through the state module's
 *   broadcasters; `WebThemeBindings` subscribes and mirrors state
 *   into the DOM.
 */
export const ACTIVE_THEME_STORE = Symbol.for("ACTIVE_THEME_STORE");
