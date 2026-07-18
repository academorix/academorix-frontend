/**
 * @file index.ts
 * @module @academorix/i18n/context
 *
 * @description
 * Public barrel for the runtime React layer — the factory that
 * produces a locale-bound {LocaleProvider, useLocale, predicates}
 * bundle for a concrete app.
 */

export { createLocaleContext } from "./create-locale-context";
export type {
  LocaleContextBundle,
  LocaleContextValue,
  LocaleProviderProps,
} from "./create-locale-context";
