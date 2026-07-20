/**
 * @file discovery-service.interface.ts
 * @module @stackra/contracts/interfaces/discovery
 * @description Cross-platform discovery service contract.
 *
 *   Every discovery-consuming package (loaders in cache, console, events,
 *   logger, queue, routing/guards, routing/middleware, ...) depends only on
 *   this interface — never on the concrete `ContainerDiscoveryService`.
 *   The `DISCOVERY_SERVICE` token binds the concrete implementation at DI
 *   registration time; the loader stays platform-agnostic.
 *
 *   Two axes of discovery: providers and modules.
 *
 *   - `getProviders()` / `getProvidersByMetadata()` — the classic axis.
 *     Every provider registered in the container. Loaders that scan
 *     `@Command()`, `@Reporter()`, `@Processor()`-decorated CLASSES use
 *     these.
 *   - `getModules()` — the module-manifest axis. Returns every module
 *     class in the container. Loaders that scan STATIC METHODS on module
 *     classes (`static configurePublishables`, `static configureRoutes`,
 *     ...) use this. The consumer probes each returned class with
 *     `typeof M.methodName === 'function'` — no separate metadata key.
 */

import type { Type } from "../type.interface";
import type { IDiscoveryProvider } from "./discovery-provider.interface";

/**
 * Platform-agnostic service for discovering providers + modules in the
 * DI graph.
 *
 * Inject via `@Inject(DISCOVERY_SERVICE)` — never depend on the concrete
 * implementation class. Every framework package that scans the container
 * follows this rule so the underlying discovery strategy (reflection,
 * build-time manifest, ...) stays swappable.
 */
export interface IDiscoveryService {
  /**
   * Get every provider registered in the container.
   *
   * Includes providers from every imported module (global and non-global).
   * Excludes value-only + factory-only providers that never resolve to a
   * live class instance (loaders operate on class-level metadata, so a
   * value provider carrying no class reference is opaque to them).
   *
   * @returns Every resolved class-based provider.
   */
  getProviders(): IDiscoveryProvider[];

  /**
   * Get providers whose class carries a specific metadata key.
   *
   * The most-used API — every loader in the workspace calls this with its
   * own domain metadata key (`COMMAND_METADATA_KEY`, `REPORTER_METADATA_KEY`,
   * `PROCESSOR_METADATA_KEY`, ...).
   *
   * @param key - The metadata key to filter by (string or symbol).
   * @returns Providers whose metatype declared the metadata key with a
   *   non-null / non-undefined value.
   */
  getProvidersByMetadata(key: string | symbol): IDiscoveryProvider[];

  /**
   * Get every module class currently registered in the container.
   *
   * Returns the module CLASSES themselves (not instances) — the caller
   * uses `typeof M.someStaticMethod === 'function'` to probe for
   * static-method manifest hooks (e.g. `configurePublishables`) and
   * calls them with a domain consumer.
   *
   * Design rationale: publishables, scheduled tasks, health checks,
   * feature-flag manifests — anything the module DECLARES rather than
   * INJECTS — is a static-method concern. Iterating module classes is
   * the discovery seam for that whole pattern.
   *
   * @example
   * ```typescript
   * // In a loader:
   * const consumer = new PublishableConsumer(this.registry);
   * for (const M of this.discovery.getModules()) {
   *   const fn = (M as { configurePublishables?: (c: unknown) => void })
   *     .configurePublishables;
   *   if (typeof fn === 'function') fn.call(M, consumer);
   * }
   * ```
   *
   * @returns Every module class currently registered — de-duplicated. The
   *   order is not guaranteed and callers must not rely on it.
   */
  getModules(): readonly Type<unknown>[];
}
