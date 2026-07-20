/**
 * @file translate.util.ts
 * @module @stackra/i18n/core/utils
 * @description Non-hook translation shorthand `__(key, params?)`.
 *
 *   Call sites that can't use `useI18n()` — Zod schemas, factories
 *   built at import time, and other non-React code paths — reach for
 *   `__` to obtain a translated string. When the singleton `I18nManager`
 *   has been bootstrapped (via `WebI18nModule.forRoot` or the native
 *   equivalent), the helper delegates to it. When it has not (SSR
 *   pre-hydration, unit tests that skip DI), the helper returns the key
 *   unchanged.
 *
 *   The design mirrors WordPress / Laravel's `__()` helper — the key is
 *   its own English fallback, so nothing renders as `undefined`.
 */

/**
 * Loose shape of the singleton translator so we don't take a hard
 * dependency on the runtime types from a non-hook util.
 */
type Translator = {
  translate: (key: string, params?: Record<string, unknown>) => string;
};

/**
 * Container for a caller-supplied translator singleton.
 *
 * The i18n platform module (`WebI18nModule.forRoot()` /
 * `NativeI18nModule.forRoot()`) calls `setDefaultTranslator(manager)`
 * on bootstrap. Every subsequent `__(key)` call resolves through that
 * translator. Tests that need to inject a stub can do the same.
 */
let defaultTranslator: Translator | null = null;

/**
 * Register the process-wide translator used by `__(key)`.
 *
 * @param translator - The translator or `null` to reset.
 */
export function setDefaultTranslator(translator: Translator | null): void {
  defaultTranslator = translator;
}

/**
 * Non-hook translation shorthand.
 *
 * @param key    - Translation key (e.g. `'auth.login.title'`).
 * @param params - Optional interpolation params.
 * @returns The translated string, or the key itself when the singleton
 *   translator hasn't been registered.
 *
 * @example
 * ```typescript
 * import { __ } from '@stackra/i18n/react';
 *
 * export const loginSchema = z.object({
 *   email: z.string().email(__('auth.login.errors.email.invalid')),
 * });
 * ```
 */
export function __(key: string, params?: Record<string, unknown>): string {
  if (!defaultTranslator) return key;
  try {
    return defaultTranslator.translate(key, params);
  } catch {
    // Fail-soft — never let a broken translator crash the caller.
    return key;
  }
}
