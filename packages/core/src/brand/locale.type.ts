/**
 * @file locale.type.ts
 * @module @academorix/core/brand/locale.type
 *
 * @description
 * The abstract `Locale` brand — the type-only base that
 * `@academorix/i18n` (and each app's `i18n.config.ts`) extends when
 * declaring the concrete list of supported locales.
 *
 * Keeping the brand type here (in the zero-dep foundation) means:
 *
 *  - Every package that touches locales can accept a `Locale` without
 *    depending on `@academorix/i18n`.
 *  - Different consumers can declare different concrete unions (e.g.
 *    marketing supports `"en" | "ar" | "fr"` while dashboard is
 *    `"en" | "ar"`) — both narrow to the same base brand.
 */

import type { Brand } from "./brand.type";

/**
 * Nominal-typed locale identifier. Extend at the app / package level
 * with a concrete union to constrain which values are legal.
 *
 * @example
 * ```ts
 * // In @academorix/i18n or an app's i18n.config.ts
 * export const LOCALES = ["en", "ar"] as const;
 * export type Locale = (typeof LOCALES)[number] & LocaleBrand;
 * ```
 *
 * At the consuming site the plain `string` type stays incompatible
 * with `Locale` unless the string went through `resolveLocale()` or
 * the concrete const tuple.
 */
export type LocaleBrand = Brand<string, "Locale">;
