/**
 * @file storage-manager.service.ts
 * @module @stackra/storage/core/services
 * @description Concrete `MultipleInstanceManager<IStorage>` — the
 *   package's central injectable. Resolves named `IStorage`
 *   instances lazily, caches them after first access, and lets
 *   platform modules register their driver factories via
 *   `manager.extend(name, creator)`.
 */

import { Injectable, Inject } from "@stackra/container";
import { MultipleInstanceManager } from "@stackra/support";
import {
  STORAGE_CONFIG,
  type IStorage,
  type IStorageConfig,
  type IStorageManager,
} from "@stackra/contracts";

import { StorageDriverError } from "@/core/errors/storage-driver.error";
import { MemoryStore } from "@/core/stores/memory.store";
import { NullStore } from "@/core/stores/null.store";

/**
 * Storage manager — resolves named `IStorage` instances lazily.
 *
 * Extends `MultipleInstanceManager<IStorage>` from `@stackra/support`,
 * mirroring the pattern `@stackra/cache`, `@stackra/http`, and
 * `@stackra/queue` follow.
 *
 * Built-in cross-platform drivers:
 *
 * - `memory` — in-process `Map` (see {@link MemoryStore}).
 * - `null` — no-op sink (see {@link NullStore}).
 *
 * Platform-specific drivers (`localStorage`, `sessionStorage`,
 * `indexedDB`, `asyncStorage`, …) register from their subpath
 * modules via `manager.extend(name, creator)` — the core manager
 * class stays platform-agnostic.
 *
 * @example
 * ```typescript
 * // Consumer service:
 * @Injectable()
 * class PrefsService {
 *   constructor(@Inject(STORAGE_MANAGER) private readonly storage: IStorageManager) {}
 *
 *   async loadTheme(): Promise<string> {
 *     return (await this.storage.instance('preferences').get<string>('theme')) ?? 'light';
 *   }
 * }
 * ```
 */
@Injectable()
export class StorageManager extends MultipleInstanceManager<IStorage> implements IStorageManager {
  /**
   * @param config - The merged storage config, injected under
   *   `STORAGE_CONFIG` by `StorageModule.forRoot`.
   */
  public constructor(@Inject(STORAGE_CONFIG) private readonly config: IStorageConfig) {
    super();
  }

  // ── MultipleInstanceManager contract ─────────────────────────────

  /** @inheritdoc */
  public override getDefaultInstance(): string {
    return this.config.default;
  }

  /** @inheritdoc */
  public override setDefaultInstance(name: string): void {
    if (!(name in this.config.stores)) {
      throw new StorageDriverError(name, "<unknown>");
    }
    (this.config as { default: string }).default = name;
  }

  /** @inheritdoc */
  public override getInstanceConfig(name: string): Record<string, unknown> | null {
    const raw = this.config.stores[name];
    if (!raw) return null;

    // Enrich the config with the instance name so drivers can use it
    // as a default prefix (see LocalStorageStore / SessionStorageStore).
    return {
      ...(raw as unknown as Record<string, unknown>),
      __instanceName: name,
    };
  }

  // ── Built-in drivers ─────────────────────────────────────────────

  /**
   * Create the built-in in-memory driver.
   *
   * @returns A new `MemoryStore` instance.
   */
  protected createMemoryDriver(): IStorage {
    return new MemoryStore();
  }

  /**
   * Create the built-in no-op driver.
   *
   * @returns A new `NullStore` instance.
   */
  protected createNullDriver(): IStorage {
    return new NullStore();
  }
}
