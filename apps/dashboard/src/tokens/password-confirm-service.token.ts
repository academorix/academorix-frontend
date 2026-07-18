/**
 * @file password-confirm-service.token.ts
 * @module @academorix/dashboard/tokens
 * @description Injection token for the {@link PasswordConfirmService} — the
 *   app-wide step-up gate that pops a password prompt before sensitive
 *   verbs. Consumers reach it via `useInject(PASSWORD_CONFIRM_SERVICE)`
 *   inside a React hook, or `@Inject(PASSWORD_CONFIRM_SERVICE)` in a
 *   class provider.
 */

/**
 * DI token bound to `PasswordConfirmService`.
 */
export const PASSWORD_CONFIRM_SERVICE: unique symbol = Symbol("PASSWORD_CONFIRM_SERVICE");
