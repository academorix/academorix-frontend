/**
 * @file ai-tool-action.handler.ts
 * @module @stackra/ai/core/handlers
 * @description `AiToolActionHandler` — the framework Action handler for
 *   `ActionKind.AiTool` descriptors. Bridges an LLM-issued tool call,
 *   pre-flighted by {@link ToolExecutor}, through the
 *   `@stackra/actions` middleware pipeline (`Authorize → Log → Trace`)
 *   before invoking the registered handler.
 *
 *   Responsibilities kept in this class (kept intentionally narrow —
 *   the executor does the heavy lifting):
 *
 *   1. Look up the tool by name in the shared {@link ToolRegistry}.
 *   2. Honor `IActionContext.signal` — abort short-circuits.
 *   3. Invoke the registered `entry.handler(args, { signal })`.
 *   4. Wrap success as `{ success: true, data: result }`.
 *   5. Wrap failure as `{ success: false, message }` — never throw.
 *
 *   Everything else (schema validation, approval gating, backend
 *   result posting) lives in `ToolExecutor` upstream of the dispatch.
 */

import { Inject, Injectable } from "@stackra/container";
import { Logger } from "@stackra/logger";
import {
  AI_TOOL_REGISTRY,
  ActionKind,
  type IActionContext,
  type IActionHandler,
  type IActionResponse,
  type IAiToolAction,
} from "@stackra/contracts";

import { ToolRegistry } from "../registries/tool.registry";

/**
 * Action handler for `ActionKind.AiTool` descriptors.
 *
 * Registered onto the framework dispatcher by the consumer app via
 * `ActionsModule.forFeature([AiToolActionHandler])`. When absent, the
 * `ToolExecutor` degrades to its headless `dispatchDirect` path — so
 * the handler is opt-in.
 *
 * @example
 * ```ts
 * import { ActionsModule } from '@stackra/actions';
 * import { AiToolActionHandler, WebAiModule } from '@stackra/ai/react';
 *
 * @Module({
 *   imports: [
 *     ActionsModule.forRoot(),
 *     WebAiModule.forRoot(aiConfig),
 *     ActionsModule.forFeature([AiToolActionHandler]),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Injectable()
export class AiToolActionHandler implements IActionHandler<IAiToolAction, unknown> {
  private readonly logger = new Logger(AiToolActionHandler.name);

  /** Bound to `ActionKind.AiTool` — the dispatcher indexes by this. */
  public readonly kind = ActionKind.AiTool;

  public constructor(@Inject(AI_TOOL_REGISTRY) private readonly registry: ToolRegistry) {}

  /**
   * Execute an `ai.tool` descriptor by looking up the registered tool
   * and invoking its handler.
   *
   * @param descriptor - Pre-validated `IAiToolAction` from
   *   {@link ToolExecutor.dispatchViaActions}. `args` has already been
   *   parsed against the tool's parameter schema; `scope` (when set)
   *   was declared on the tool definition.
   * @param context - Framework action context. Its `signal` is
   *   forwarded to the tool handler so `cancelRun()` upstream cascades
   *   to the tool implementation (Req 8.7 of framework-action-handlers).
   * @returns `{ success: true, data }` on success or
   *   `{ success: false, message }` on failure. Never throws.
   */
  public async execute(
    descriptor: IAiToolAction,
    context: IActionContext,
  ): Promise<IActionResponse<unknown>> {
    // Early-abort short-circuit — mirrors the dispatcher's own guard so
    // an aborted context never reaches the tool handler at all.
    if (context.signal?.aborted) {
      return { success: false, message: "Aborted" };
    }

    const entry = this.registry.findByName(descriptor.toolName);
    if (!entry) {
      // Unknown tool = registration lag between the LLM's toolset view
      // and the local registry. Report explicitly so the executor
      // upstream can post a distinguishable error back to the backend.
      const message = `No AI tool registered with name "${descriptor.toolName}"`;
      this.logger.warn(`[AiToolActionHandler] ${message}`, {
        toolName: descriptor.toolName,
        toolCallId: descriptor.toolCallId,
      });
      return { success: false, message };
    }

    // Every registered tool handler expects a signal. Use the caller's
    // when present; otherwise supply an inert one (never aborts).
    const signal = context.signal ?? new AbortController().signal;

    try {
      const result = await entry.handler(descriptor.args, { signal });

      // Post-await abort check — safeguards the case where the caller
      // aborts between `entry.handler` resolving and this line running.
      if (context.signal?.aborted) {
        return { success: false, message: "Aborted" };
      }
      return { success: true, data: result };
    } catch (err) {
      // Handlers should not throw — but if they do, translate to the
      // standard `{ success: false }` response so the dispatcher's outer
      // `try/catch` stays a defense-in-depth backstop, not the primary
      // error path (matches every other framework handler).
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[AiToolActionHandler] handler threw for "${descriptor.toolName}"`, {
        toolCallId: descriptor.toolCallId,
        error: message,
      });
      return { success: false, message };
    }
  }
}
