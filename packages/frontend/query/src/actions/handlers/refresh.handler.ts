/**
 * @file refresh.handler.ts
 * @module @stackra/query/actions/handlers
 * @description RefreshHandler — invalidate one or more cached queries.
 */

import { Inject, Injectable } from '@stackra/container';
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  IQueryClient,
  IRefreshAction,
} from '@stackra/contracts';
import { ActionKind, QUERY_CLIENT } from '@stackra/contracts';

/**
 * `RefreshHandler` — dispatch handler for `ActionKind.Refresh`.
 */
@Injectable()
export class RefreshHandler implements IActionHandler<IRefreshAction, { invalidated: number }> {
  public readonly kind = ActionKind.Refresh;

  public constructor(@Inject(QUERY_CLIENT) private readonly client: IQueryClient) {}

  public async execute(
    descriptor: IRefreshAction,
    context: IActionContext
  ): Promise<IActionResponse<{ invalidated: number }>> {
    if (context.signal?.aborted) return { success: false, message: 'Aborted' };

    const keys: ReadonlyArray<readonly unknown[]> =
      descriptor.keys ?? this.deriveKeys(descriptor.resource);

    for (const key of keys) {
      await this.client.invalidate(key);
    }

    return { success: true, data: { invalidated: keys.length } };
  }

  private deriveKeys(resource: string | undefined): ReadonlyArray<readonly unknown[]> {
    if (!resource) return [];
    return this.client.keys().filter((key) => Array.isArray(key) && key[0] === resource);
  }
}
