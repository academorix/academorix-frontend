/**
 * @file merge.service.ts
 * @module @stackra/sync/core/services
 * @description MergeService — lands remote documents into the local
 *   storage adapter and routes any detected conflict through the
 *   configured resolver.
 */

import { Inject, Injectable } from '@stackra/container';
import type { ILocalStorageAdapter } from '@stackra/contracts';
import { CONFLICT_RESOLVER, LOCAL_STORAGE_ADAPTER } from '@stackra/contracts';
import { Logger } from '@stackra/logger';
import type { ConflictResolver } from '../resolvers/conflict.resolver';

/**
 * MergeService — applies remote documents to the local store with
 * conflict resolution.
 */
@Injectable()
export class MergeService {
  private readonly logger = new Logger(MergeService.name);

  public constructor(
    @Inject(LOCAL_STORAGE_ADAPTER) private readonly storage: ILocalStorageAdapter,
    @Inject(CONFLICT_RESOLVER) private readonly conflictResolver: ConflictResolver
  ) {}

  /**
   * Merge a batch of remote documents into the local store.
   *
   * @returns Number of conflicts encountered and resolved.
   */
  public async merge<T extends Record<string, unknown> & { id: string }>(
    collection: string,
    remoteDocuments: T[]
  ): Promise<number> {
    let conflictsResolved = 0;

    for (const remoteDoc of remoteDocuments) {
      try {
        const localDoc = await this.storage.findOne<T>(collection, remoteDoc.id);

        if (!localDoc) {
          await this.storage.insert(collection, remoteDoc);
          continue;
        }

        const conflict = this.conflictResolver.detectConflict(
          collection,
          remoteDoc.id,
          localDoc as Record<string, unknown>,
          remoteDoc as Record<string, unknown>,
          new Date(
            String(
              (localDoc as Record<string, unknown>).updatedAt ??
                (localDoc as Record<string, unknown>).createdAt ??
                0
            )
          ),
          new Date(
            String(
              (remoteDoc as Record<string, unknown>).updatedAt ??
                (remoteDoc as Record<string, unknown>).createdAt ??
                0
            )
          )
        );

        if (conflict) {
          const resolution = await this.conflictResolver.resolve(conflict);
          await this.storage.update(collection, remoteDoc.id, resolution.resolved as Partial<T>);
          conflictsResolved++;
        } else {
          await this.storage.update(collection, remoteDoc.id, remoteDoc);
        }
      } catch (error: unknown) {
        this.logger.error(`[MergeService] Failed to merge ${collection}:${remoteDoc.id}`, {
          error,
        });
        throw error;
      }
    }

    return conflictsResolved;
  }
}
