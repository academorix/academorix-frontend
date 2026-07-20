/**
 * @file theme-token-store.token.ts
 * @module @stackra/theming/core/tokens
 * @description DI token for the `ThemeTokenStore` — the reactive store
 *   that holds the currently-active theme state
 *   (`themeId` + `mode` + `resolvedMode`).
 *
 *   The store is internal plumbing owned by `@stackra/theming` — it has
 *   no cross-package consumer, so the token stays local (unlike
 *   `THEME_REGISTRY` / `THEME_SERVICE` which live in
 *   `@stackra/contracts`).
 */

export const THEME_TOKEN_STORE = Symbol.for("THEME_TOKEN_STORE");
