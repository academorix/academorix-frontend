/**
 * @file scope.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the dynamic scope system.
 *   Used by `@stackra/scope` and any package that resolves scope values.
 */

/**
 * Token for the {@link IScopeService} singleton.
 *
 * Provides CRUD operations, cascading resolution, bulk operations, and
 * inheritance visualization for the scope tree.
 */
export const SCOPE_SERVICE = Symbol.for("SCOPE_SERVICE");

/**
 * Token for the {@link IScopeCache} singleton.
 *
 * Provides Redis-backed caching with LRU fallback for hot-path scope
 * resolution.
 */
export const SCOPE_CACHE = Symbol.for("SCOPE_CACHE");

/**
 * Token for the {@link IScopeContextStore} singleton.
 *
 * Wraps `AsyncLocalStorage` (backend) or React Context (frontend) to
 * provide request-scoped access to the active `IScopeContext`. All
 * downstream code (ORM filters, cache, DataLoaders) reads from this store.
 */
export const SCOPE_CONTEXT_STORE = Symbol.for("SCOPE_CONTEXT_STORE");

/** Token for the {@link IScopeRegistry} of consumer configurations. */
export const SCOPE_REGISTRY = Symbol.for("SCOPE_REGISTRY");

/** Token for the {@link IScopeEmulator} service. */
export const SCOPE_EMULATOR = Symbol.for("SCOPE_EMULATOR");

/** Token for the resolved {@link IScopeModuleOptions}. */
export const SCOPE_MODULE_OPTIONS = Symbol.for("SCOPE_MODULE_OPTIONS");

/**
 * Token for the `IScopePersistAdapter` — pluggable persistence for the
 * active scope node id across app restarts.
 *
 * Bound by `ScopeModule.forRoot({ storage: '<instance>' })` to a
 * `StorageBackedScopePersistAdapter` that reads / writes through the
 * app's `StorageManager`. Unbound when `storage` is omitted /
 * `'memory'` — the data source's own `persist(scope)` is the only
 * write path.
 */
export const SCOPE_PERSIST_ADAPTER = Symbol.for("SCOPE_PERSIST_ADAPTER");
