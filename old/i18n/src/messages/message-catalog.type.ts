/**
 * @file message-catalog.type.ts
 * @module @academorix/i18n/messages/message-catalog.type
 *
 * @description
 * Contract for a message catalog + a small interpolator that both
 * dashboards' Refine adapter and the landing-page's next-intl usage
 * can share.
 *
 * We deliberately keep the shape flat (`Record<string, string>` with
 * dot-separated keys) so:
 *   - Refine's i18nProvider signature drops in unchanged.
 *   - Split-by-locale JSON files can be produced by any translation
 *     pipeline (Crowdin, Lokalise, POEditor) without extra tooling.
 *   - Missing keys can fall back to a default locale by a simple
 *     `catalog[key] ?? defaultCatalog[key] ?? key`.
 *
 * More sophisticated catalogs (ICU plurals, gender selectors) belong
 * to the app that needs them — this package stays minimal.
 */

/**
 * A message catalog: a flat map of dot-keyed message ids to
 * translated strings. Keys are opaque to this package; consumers
 * decide their own namespace convention.
 *
 * @example
 * ```ts
 * const en: MessageCatalog = {
 *   "buttons.save": "Save",
 *   "app.accessDenied.title": "Access denied",
 * };
 * ```
 */
export type MessageCatalog = Record<string, string>;
