/**
 * @file index.ts
 * @module @stackra/i18n/core/hooks
 * @description Cross-platform React hooks — consumed by both the `./react`
 *   and `./native` subpaths (per the workspace `core/hooks` rule for
 *   hooks reused across web + native).
 */

export { useI18n } from "./use-i18n";
export { useLocale } from "./use-locale";
export { useDirection } from "./use-direction";
export { useFormat } from "./use-format";
