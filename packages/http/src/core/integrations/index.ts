/**
 * @file index.ts
 * @module @stackra/http/core/integrations
 * @description Optional integration seams for cross-package services that
 *   the built-in middleware can consume when present.
 *
 *   The i18n locale service seam has been promoted to `@stackra/contracts`
 *   (`I18N_LOCALE_SERVICE` + `II18nLocaleService`). `LocaleHeaderMiddleware`
 *   injects it directly from contracts.
 *
 *   The scope/tenant context seam is still declared locally because
 *   `@stackra/scope` is not yet promoted to a cross-package contract.
 *   When it is, these declarations move to contracts and this file goes
 *   away.
 */

/** Token for an optional scope/tenant context store (`TenantHeaderMiddleware`). */
export const SCOPE_CONTEXT_STORE = Symbol.for('SCOPE_CONTEXT_STORE');

/** The active scope/tenant context. */
export interface IScopeContext {
  /** The owning tenant/organisation identifier. */
  ownerId?: string;
  /** Additional scope fields are permitted. */
  [key: string]: unknown;
}

/** Minimal scope context store consumed by `TenantHeaderMiddleware`. */
export interface IScopeContextStore {
  /** Return the current scope context, or `null`/`undefined` when unset. */
  get(): IScopeContext | null | undefined;
}
