/**
 * @file consent.module.ts
 * @module @stackra/consent/core
 * @description Core DI module for the consent system.
 *
 *   Provides `forRoot()` and `forRootAsync()` registration. The core module
 *   binds the `MemoryConsentAdapter` by default; platform subpath modules
 *   (e.g. `WebConsentModule`) import this module and override the
 *   `CONSENT_STORAGE_ADAPTER` token with a platform-specific adapter.
 *
 *   `forRoot(...)` lists providers only — no bootstrap classes, no
 *   side-effect factories. Category population lives in
 *   `ConsentRegistry.onModuleInit()`; state hydration lives in
 *   `ConsentManager.onApplicationBootstrap()`.
 */

import { Module, type DynamicModule, type Provider } from '@stackra/container';
import {
  CONSENT_CONFIG,
  CONSENT_MANAGER,
  CONSENT_STORAGE_ADAPTER,
  type IAsyncModuleOptions,
} from '@stackra/contracts';

import { CONSENT_REGISTRY } from './constants';
import { MemoryConsentAdapter } from './adapters/memory-consent.adapter';
import { StorageBackedConsentAdapter } from './adapters/storage-backed-consent.adapter';
import { ConsentManager } from './services/consent-manager.service';
import { ConsentRegistry } from './services/consent-registry.service';
import { mergeConfig } from './utils/merge-config.util';
import type { IConsentModuleOptions } from './types';

/**
 * Backends that resolve to the durable, storage-backed adapter.
 * Only `'memory'` (and `undefined`) stay on the headless adapter —
 * every other value (`'localStorage'`, `'sessionStorage'`,
 * `'indexedDB'`, `'cookie'`, or any custom instance name) resolves
 * through the app's `StorageManager`. The `'cookie'` driver landed
 * in `@stackra/storage/react` in the pattern-alignment sweep.
 */
function needsStorageBacking(storage: IConsentModuleOptions['storage']): boolean {
  if (!storage) return false;
  return storage !== 'memory';
}

/**
 * Pick the adapter provider based on the config's `storage` field.
 *
 * - `'memory'` / omitted → `MemoryConsentAdapter` (no dependency on
 *   `@stackra/storage`; safe for headless / tests).
 * - Any other value → `StorageBackedConsentAdapter` — resolves the
 *   named `IStorage` from the app's `StorageManager`. `'cookie'`
 *   included, backed by the `CookieStore` driver registered on
 *   `WebStorageModule`.
 */
function storageAdapterProvider(options: Partial<IConsentModuleOptions>): Provider {
  if (needsStorageBacking(options.storage)) {
    return { provide: CONSENT_STORAGE_ADAPTER, useClass: StorageBackedConsentAdapter };
  }
  return { provide: CONSENT_STORAGE_ADAPTER, useClass: MemoryConsentAdapter };
}

/**
 * Core consent DI module.
 *
 * Provides platform-agnostic consent infrastructure — `ConsentRegistry`,
 * `ConsentManager`, and `MemoryConsentAdapter` (default). Platform subpath
 * modules import this module and override `CONSENT_STORAGE_ADAPTER`.
 *
 * @example
 * ```typescript
 * @Module({ imports: [ConsentModule.forRoot({ categories: [...] })] })
 * export class AppModule {}
 * ```
 */
@Module({})
export class ConsentModule {
  /**
   * Register the consent module globally with the MemoryAdapter default.
   *
   * @param options - Consent module configuration.
   * @returns Dynamic module definition.
   */
  public static forRoot(options: Partial<IConsentModuleOptions> = {}): DynamicModule {
    const config = mergeConfig(options);

    return {
      module: ConsentModule,
      global: true,
      providers: [
        { provide: CONSENT_CONFIG, useValue: config },
        ConsentRegistry,
        { provide: CONSENT_REGISTRY, useExisting: ConsentRegistry },
        // Storage-backed when `storageInstance` is set, memory otherwise.
        storageAdapterProvider(options),
        ConsentManager,
        { provide: CONSENT_MANAGER, useExisting: ConsentManager },
      ],
      exports: [
        CONSENT_CONFIG,
        CONSENT_STORAGE_ADAPTER,
        CONSENT_REGISTRY,
        CONSENT_MANAGER,
        ConsentRegistry,
        ConsentManager,
      ],
    };
  }

  /**
   * Register the consent module with async/factory configuration.
   *
   * @param options - Async configuration (`useFactory`, `inject`, `imports`).
   * @returns Dynamic module definition.
   */
  public static forRootAsync(
    options: IAsyncModuleOptions<Partial<IConsentModuleOptions>>
  ): DynamicModule {
    return {
      module: ConsentModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: CONSENT_CONFIG,
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },
        ConsentRegistry,
        { provide: CONSENT_REGISTRY, useExisting: ConsentRegistry },
        // Async form always binds the storage-backed adapter — an
        // async factory implies the caller wants a fully-wired
        // production setup. Consumers who want no persistence pass
        // `storage: 'memory'` in their factory result — the adapter
        // still constructs but the manager returns the memory
        // instance if that's what's registered.
        { provide: CONSENT_STORAGE_ADAPTER, useClass: StorageBackedConsentAdapter },
        ConsentManager,
        { provide: CONSENT_MANAGER, useExisting: ConsentManager },
      ],
      exports: [
        CONSENT_CONFIG,
        CONSENT_STORAGE_ADAPTER,
        CONSENT_REGISTRY,
        CONSENT_MANAGER,
        ConsentRegistry,
        ConsentManager,
      ],
    };
  }
}
