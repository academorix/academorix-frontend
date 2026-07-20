/**
 * @file query.handler.ts
 * @module @stackra/query/actions/handlers
 * @description QueryHandler — invalidate and/or refetch a cached query.
 *
 *   Delegates to `IQueryClient` (which wraps TanStack Query's
 *   `QueryClient`). `invalidate` marks queries stale and refetches
 *   any active observers; `refetch` force-refreshes regardless of
 *   staleness.
 */

import { Inject, Injectable } from "@stackra/container";
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  IQueryAction,
  IQueryClient,
} from "@stackra/contracts";
import { ActionKind, QUERY_CLIENT } from "@stackra/contracts";

/**
 * `QueryHandler` — dispatch handler for `ActionKind.Query`.
 */
@Injectable()
export class QueryHandler implements IActionHandler<IQueryAction> {
  public readonly kind = ActionKind.Query;

  public constructor(@Inject(QUERY_CLIENT) private readonly client: IQueryClient) {}

  public async execute(
    descriptor: IQueryAction,
    context: IActionContext,
  ): Promise<IActionResponse> {
    if (context.signal?.aborted) return { success: false, message: "Aborted" };

    if (descriptor.invalidate) {
      await this.client.invalidate(descriptor.queryKey);
    }

    if (descriptor.refetch ?? true) {
      try {
        const data = await this.client.refetch(descriptor.queryKey);
        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : String(err),
        };
      }
    }

    return { success: true };
  }
}
