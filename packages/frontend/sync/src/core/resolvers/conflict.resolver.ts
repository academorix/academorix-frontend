/**
 * @file conflict.resolver.ts
 * @module @stackra/sync/core/resolvers
 * @description ConflictResolver — routes conflicts through configured
 *   strategies (last-write-wins, remote-wins, local-wins, or a custom
 *   callback registered per collection).
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type {
  IConflict,
  IConflictResolution,
  IConflictResolverConfig,
  IConflictResolverFn,
} from "@stackra/contracts";
import { CONFLICT_RESOLVER_CONFIG, ConflictStrategy } from "@stackra/contracts";
import { Logger } from "@stackra/logger";
import { Str } from "@stackra/support";

import { ConflictError } from "../errors/conflict.error";
import { lastWriteWins } from "../strategies/last-write-wins.strategy";
import { localWins } from "../strategies/local-wins.strategy";
import { remoteWins } from "../strategies/remote-wins.strategy";

/**
 * ConflictResolver — routes a conflict through a strategy and returns
 * an {@link IConflictResolution}.
 *
 * @example
 * ```typescript
 * resolver.registerCustomResolver('users', async (conflict) => ({
 *   ...conflict.local,
 *   ...conflict.remote,
 *   mergedAt: new Date(),
 * }));
 *
 * const resolution = await resolver.resolve(conflict);
 * ```
 */
@Injectable()
export class ConflictResolver {
  private readonly logger = new Logger(ConflictResolver.name);
  private readonly config: Required<IConflictResolverConfig>;
  private readonly customResolvers = new Map<string, IConflictResolverFn>();
  private readonly builtInStrategies: Record<ConflictStrategy, IConflictResolverFn> = {
    [ConflictStrategy.LastWriteWins]: lastWriteWins,
    [ConflictStrategy.RemoteWins]: remoteWins,
    [ConflictStrategy.LocalWins]: localWins,
    [ConflictStrategy.Custom]: () => {
      throw new Error("Custom strategy requires a registered resolver function");
    },
  };

  public constructor(
    @Optional() @Inject(CONFLICT_RESOLVER_CONFIG) config: IConflictResolverConfig = {},
  ) {
    this.config = {
      defaultStrategy: config.defaultStrategy ?? ConflictStrategy.LastWriteWins,
      collectionStrategies: config.collectionStrategies ?? {},
      customResolvers: config.customResolvers ?? {},
    };

    for (const [collection, resolver] of Object.entries(this.config.customResolvers)) {
      this.customResolvers.set(collection, resolver);
    }
  }

  /** Register a custom resolver for a collection. */
  public registerCustomResolver(collection: string, resolver: IConflictResolverFn): void {
    this.customResolvers.set(collection, resolver);
  }

  /** Override the strategy for a specific collection. */
  public setCollectionStrategy(collection: string, strategy: ConflictStrategy): void {
    this.config.collectionStrategies[collection] = strategy;
  }

  /** Read the strategy that will be applied to a collection's conflicts. */
  public getStrategy(collection: string): ConflictStrategy {
    return this.config.collectionStrategies[collection] ?? this.config.defaultStrategy;
  }

  /** Change the default strategy applied when no per-collection override matches. */
  public setDefaultStrategy(strategy: ConflictStrategy): void {
    this.config.defaultStrategy = strategy;
  }

  /**
   * Resolve a single conflict.
   */
  public async resolve<T>(conflict: IConflict<T>): Promise<IConflictResolution<T>> {
    const strategy = this.getStrategy(conflict.collection);

    try {
      let resolved: T;
      let winner: "local" | "remote" | "merged";

      if (this.customResolvers.has(conflict.collection)) {
        const customResolver = this.customResolvers.get(conflict.collection)!;
        resolved = await Promise.resolve(customResolver(conflict) as T);
        winner = "merged";
      } else if (strategy === ConflictStrategy.Custom) {
        throw new ConflictError(
          `Custom strategy specified for collection "${conflict.collection}" but no custom resolver registered`,
          conflict,
        );
      } else {
        const resolver = this.builtInStrategies[strategy];
        resolved = await Promise.resolve(resolver(conflict) as T);

        if (strategy === ConflictStrategy.RemoteWins) {
          winner = "remote";
        } else if (strategy === ConflictStrategy.LocalWins) {
          winner = "local";
        } else {
          winner = conflict.remoteTimestamp > conflict.localTimestamp ? "remote" : "local";
        }
      }

      const resolution: IConflictResolution<T> = {
        resolved,
        strategy,
        timestamp: new Date(),
        winner,
      };

      this.logger.info(
        `[ConflictResolver] Resolved conflict for ${conflict.collection}:${conflict.id} using ${strategy} (winner: ${winner})`,
      );

      return resolution;
    } catch (error: unknown) {
      if (error instanceof ConflictError) throw error;
      throw new ConflictError(
        `Failed to resolve conflict for ${conflict.collection}:${conflict.id}: ${error instanceof Error ? error.message : String(error)}`,
        conflict,
        { originalError: error },
      );
    }
  }

  /**
   * Detect a conflict by diffing two document versions.
   */
  public detectConflict<T extends Record<string, unknown>>(
    collection: string,
    id: string,
    local: T,
    remote: T,
    localTimestamp: Date,
    remoteTimestamp: Date,
  ): IConflict<T> | null {
    if (localTimestamp.getTime() === remoteTimestamp.getTime()) return null;

    const conflictingFields: string[] = [];
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const key of allKeys) {
      if (key === "id" || key === "_id" || Str.startsWith(key, "_")) continue; // metadata
      if (JSON.stringify(local[key]) !== JSON.stringify(remote[key])) conflictingFields.push(key);
    }

    if (conflictingFields.length === 0) return null;

    return {
      id,
      collection,
      local,
      remote,
      localTimestamp,
      remoteTimestamp,
      conflictingFields,
    };
  }

  /**
   * Resolve a batch of conflicts in parallel.
   */
  public async resolveMany<T>(conflicts: IConflict<T>[]): Promise<IConflictResolution<T>[]> {
    return Promise.all(conflicts.map((c) => this.resolve(c)));
  }
}
