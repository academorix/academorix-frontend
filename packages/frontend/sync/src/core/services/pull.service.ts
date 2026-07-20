/**
 * @file pull.service.ts
 * @module @stackra/sync/core/services
 * @description PullService — cursor-based incremental pull from the remote
 *   sync API. Applies each page's records to the local store and routes
 *   conflicts through the {@link ConflictResolver}.
 */

import { Inject, Injectable } from "@stackra/container";
import type {
  IHttpManager,
  ILocalStorageAdapter,
  IPullOptions,
  IPullResult,
} from "@stackra/contracts";
import { CONFLICT_RESOLVER, HTTP_MANAGER, LOCAL_STORAGE_ADAPTER } from "@stackra/contracts";
import { Logger } from "@stackra/logger";
import type { ConflictResolver } from "../resolvers/conflict.resolver";

/**
 * Server response shape for the cursor-based pull endpoint.
 * Local type — not part of the wire vocabulary.
 */
interface IPullResponsePage<T = unknown> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * PullService — cursor-based pull with conflict resolution.
 */
@Injectable()
export class PullService {
  private readonly logger = new Logger(PullService.name);

  public constructor(
    @Inject(HTTP_MANAGER) private readonly http: IHttpManager,
    @Inject(LOCAL_STORAGE_ADAPTER) private readonly storage: ILocalStorageAdapter,
    @Inject(CONFLICT_RESOLVER) private readonly conflictResolver: ConflictResolver,
  ) {}

  /**
   * Pull every available page for a collection using cursor pagination.
   */
  public async pull(collection: string, options: IPullOptions): Promise<IPullResult> {
    let totalPulled = 0;
    let totalConflicts = 0;
    let cursor = options.cursor;
    let hasMore = true;

    const client = await this.http.connection();

    while (hasMore) {
      try {
        const params: Record<string, unknown> = { limit: options.limit };
        if (cursor) params.cursor = cursor;
        if (options.since) params.since = options.since.toISOString();

        const response = await client.request<IPullResponsePage>({
          url: `${options.baseUrl}/${collection}/sync/pull`,
          method: "GET",
          params,
        });

        const page = response.data;
        const records = page.data ?? [];

        for (const remoteDoc of records) {
          const conflicted = await this.applyRecord(
            collection,
            remoteDoc as Record<string, unknown>,
          );
          if (conflicted) totalConflicts++;
        }

        totalPulled += records.length;
        cursor = page.nextCursor;
        hasMore = page.hasMore;
      } catch (error: unknown) {
        this.logger.error(`[PullService] Failed to pull "${collection}"`, { error });
        throw error;
      }
    }

    return {
      pulled: totalPulled,
      conflicts: totalConflicts,
      nextCursor: cursor,
    };
  }

  /**
   * Apply a single remote record locally, resolving a conflict if needed.
   *
   * @returns `true` when a conflict was detected and resolved.
   */
  private async applyRecord(
    collection: string,
    remoteDoc: Record<string, unknown>,
  ): Promise<boolean> {
    const id = (remoteDoc.id ?? remoteDoc._id) as string | undefined;
    if (!id) {
      await this.storage.insert(collection, remoteDoc);
      return false;
    }

    const localDoc = await this.storage.findOne<Record<string, unknown>>(collection, id);

    if (!localDoc) {
      await this.storage.insert(collection, remoteDoc);
      return false;
    }

    const localTs = new Date(String(localDoc.updatedAt ?? localDoc.createdAt ?? 0));
    const remoteTs = new Date(String(remoteDoc.updatedAt ?? remoteDoc.createdAt ?? 0));
    const conflict = this.conflictResolver.detectConflict(
      collection,
      id,
      localDoc,
      remoteDoc,
      localTs,
      remoteTs,
    );

    if (conflict) {
      const resolution = await this.conflictResolver.resolve(conflict);
      await this.storage.update(collection, id, resolution.resolved);
      return true;
    }

    await this.storage.update(collection, id, remoteDoc);
    return false;
  }
}
