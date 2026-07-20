/**
 * @file mutate.handler.ts
 * @module @stackra/query/actions/handlers
 * @description MutateHandler — execute an HTTP mutation, optionally writing
 *   the response to a state store.
 */

import { Inject, Injectable } from "@stackra/container";
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  IHttpManager,
  IMutateAction,
} from "@stackra/contracts";
import { ActionKind, HTTP_MANAGER } from "@stackra/contracts";

/**
 * `MutateHandler` — dispatch handler for `ActionKind.Mutate`.
 *
 * Fires an HTTP request through the injected {@link IHttpManager}. On
 * success, returns the response payload; on failure, returns
 * `{ success: false, message, errors? }`.
 */
@Injectable()
export class MutateHandler implements IActionHandler<IMutateAction> {
  public readonly kind = ActionKind.Mutate;

  public constructor(@Inject(HTTP_MANAGER) private readonly http: IHttpManager) {}

  public async execute(
    descriptor: IMutateAction,
    context: IActionContext,
  ): Promise<IActionResponse> {
    if (context.signal?.aborted) return { success: false, message: "Aborted" };
    if (!descriptor.endpoint) {
      return { success: false, message: "MutateAction requires an endpoint" };
    }

    const connectionName = (context.metadata?.connectionName as string | undefined) ?? undefined;
    let client;
    try {
      client = await this.http.connection(connectionName);
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "HTTP connection unavailable",
      };
    }

    try {
      const response = await client.request({
        url: descriptor.endpoint,
        method: descriptor.method ?? "POST",
        data: descriptor.body,
        params: descriptor.params,
        signal: context.signal,
      });
      return { success: true, data: response.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mutation failed";
      const errors = extractFieldErrors(err);
      return errors ? { success: false, message, errors } : { success: false, message };
    }
  }
}

/**
 * Extract Rails/Laravel-style field errors from a caught exception, if
 * the transport surfaces them via `err.errors` or `err.response.data.errors`.
 */
function extractFieldErrors(err: unknown): Record<string, string[]> | undefined {
  if (err == null || typeof err !== "object") return undefined;
  const direct = (err as { errors?: unknown }).errors;
  if (direct && typeof direct === "object") return direct as Record<string, string[]>;
  const nested = (err as { response?: { data?: { errors?: unknown } } }).response?.data?.errors;
  if (nested && typeof nested === "object") return nested as Record<string, string[]>;
  return undefined;
}
