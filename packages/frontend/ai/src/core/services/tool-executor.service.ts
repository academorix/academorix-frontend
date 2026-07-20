/**
 * @file tool-executor.service.ts
 * @module @stackra/ai/core/services
 * @description Executes client-side tool calls that arrive on the decoded
 *   AI stream, and reports their results back to the backend.
 *
 *   Pipeline for every decoded tool-call:
 *
 *   ```
 *   ToolCallEnd(id, name, args)
 *      ├─ registry.findByName(name)?
 *      │     └─ absent → server render, no local action     (Req 5.2, 8.4)
 *      ├─ validate(args, entry.schema)
 *      │     └─ invalid → postToolResult({ error })         (Req 6.13, 8.3)
 *      ├─ requiresApproval or backend-flagged?
 *      │     └─ await waitForApproval()                     (Req 9.1, 9.4)
 *      │           ├─ rejected → postToolResult({ rejected: true })  (Req 9.3)
 *      │           └─ approved → continue
 *      ├─ AbortController wired to caller's signal + registered
 *      │  under toolCallId so cancelRun can trigger it       (Req 8.6, 8.7)
 *      └─ try
 *           ├─ result = await entry.handler(args, { signal })
 *           └─ signal.aborted?  → yes, drop; no, postToolResult({ result })
 *         catch(err) → postToolResult({ error }); return output-error
 *   ```
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { Logger } from "@stackra/logger";
import {
  ACTION_DISPATCHER,
  AI_CLIENT,
  AI_TOOL_REGISTRY,
  ActionKind,
  type IActionDispatcher,
  type IAiClient,
  type IAiToolAction,
  type IAiToolResult,
} from "@stackra/contracts";

import type { IToolEntry } from "../registries/tool.registry";
import { ToolRegistry } from "../registries/tool.registry";

/** Outcome of `execute()` — mirrors the shape of the posted result. */
export interface IExecutionOutcome {
  /** The tool call is a server tool — no local action was taken. */
  serverTool?: boolean;
  /** Handler succeeded and returned this value. */
  result?: unknown;
  /** Handler failed (validation, throw, or approval rejection). */
  error?: string;
  /** User rejected an approval-required call. */
  rejected?: boolean;
  /** Execution was cancelled via the caller's signal. */
  aborted?: boolean;
}

/** Options accepted by {@link ToolExecutor.execute}. */
export interface IExecuteOptions {
  /** Backend-supplied `requiresApproval` flag for this specific call. */
  backendRequiresApproval?: boolean;
  /**
   * Function invoked when approval is required. Must resolve to `true`
   * (approve) or `false` (reject). The orchestrator supplies this so the
   * approval decision can come from the UI.
   */
  waitForApproval?: () => Promise<boolean>;
  /**
   * External cancellation signal — merged with the internal
   * AbortController. Typically the run's overall abort signal so
   * `cancelRun` cascades to the handler (Req 8.7).
   */
  signal?: AbortSignal;
}

/**
 * ToolExecutor — Requirements 5–9.
 *
 * When `@stackra/actions` is wired, the executor stops invoking the
 * registered handler directly and dispatches an `IAiToolAction`
 * descriptor through `ACTION_DISPATCHER` instead — so every AI tool call
 * gets the same `Authorize → Log → Trace → handler` treatment a button
 * press gets. When actions is absent (headless AI), the executor falls
 * back to the direct-invocation path.
 */
@Injectable()
export class ToolExecutor {
  private readonly logger = new Logger(ToolExecutor.name);

  public constructor(
    @Inject(AI_TOOL_REGISTRY) private readonly registry: ToolRegistry,
    @Inject(AI_CLIENT) private readonly client: IAiClient,
    /**
     * Optional bridge into the framework Action layer. When present,
     * tool calls flow through the actions pipeline; when absent, the
     * executor invokes the registered handler directly (headless mode).
     */
    @Optional()
    @Inject(ACTION_DISPATCHER)
    private readonly actionDispatcher?: IActionDispatcher,
  ) {}

  /**
   * Whether the given tool name maps to a locally-registered client tool.
   *
   * Used by the orchestrator to classify a decoded tool-call — an absent
   * name is a server tool and only requires render state (Req 5.1, 5.2).
   */
  public isClientTool(toolName: string): boolean {
    return this.registry.hasName(toolName);
  }

  /**
   * Execute a decoded tool-call.
   *
   * @param toolCallId - Originating tool call identifier.
   * @param toolName - Name of the invoked tool.
   * @param args - Assembled arguments (from `tool-call-delta` fragments).
   * @param options - Approval hook + cancellation signal.
   */
  public async execute(
    toolCallId: string,
    toolName: string,
    args: unknown,
    options: IExecuteOptions = {},
  ): Promise<IExecutionOutcome> {
    const entry = this.registry.findByName(toolName);

    // ── 1. Server tool → render only ─────────────────────────────────
    if (!entry) return { serverTool: true };

    // ── 2. Validate arguments against the tool's schema ──────────────
    const validation = this.validateArgs(entry, args);
    if (validation.error !== undefined) {
      await this.safePostResult({ toolCallId, error: validation.error });
      return { error: validation.error };
    }
    const parsedArgs = validation.parsed;

    // ── 3. Approval gate ─────────────────────────────────────────────
    const requiresApproval =
      options.backendRequiresApproval === true || entry.definition.requiresApproval === true;
    if (requiresApproval) {
      const decision = options.waitForApproval ? await options.waitForApproval() : false;
      if (!decision) {
        await this.safePostResult({ toolCallId, rejected: true });
        return { rejected: true };
      }
    }

    // ── 4. Wire abort signals ────────────────────────────────────────
    const controller = new AbortController();
    const external = options.signal;
    if (external) {
      if (external.aborted) controller.abort();
      else external.addEventListener("abort", () => controller.abort(), { once: true });
    }

    // ── 5. Invoke handler — through the action pipeline when wired ───
    if (this.actionDispatcher) {
      return this.dispatchViaActions(toolCallId, toolName, entry, parsedArgs, controller.signal);
    }
    return this.dispatchDirect(toolCallId, entry, parsedArgs, controller.signal);
  }

  /**
   * Direct handler invocation — used when the framework Action layer
   * is not wired. Preserves the original behavior for headless
   * `@stackra/ai` consumers.
   */
  private async dispatchDirect(
    toolCallId: string,
    entry: IToolEntry,
    parsedArgs: unknown,
    signal: AbortSignal,
  ): Promise<IExecutionOutcome> {
    try {
      const result = await entry.handler(parsedArgs, { signal });
      if (signal.aborted) {
        // Run was cancelled mid-execution — do NOT post a completed
        // result (Req 8.7).
        return { aborted: true };
      }
      await this.safePostResult({ toolCallId, result });
      return { result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.safePostResult({ toolCallId, error: message });
      return { error: message };
    }
  }

  /**
   * Bridge invocation — dispatches an `IAiToolAction` descriptor
   * through the framework's `ACTION_DISPATCHER` so every AI tool call
   * flows through `Authorize → Log → Trace → handler`. The registered
   * `AiToolActionHandler` in this package is what ultimately invokes
   * `entry.handler` on the other side, so scope namespacing, argument
   * validation, approval gating, and `postToolResult` all stay where
   * they belong (here in the executor) while authorization/tracing/
   * logging land in the shared pipeline.
   */
  private async dispatchViaActions(
    toolCallId: string,
    toolName: string,
    entry: IToolEntry,
    parsedArgs: unknown,
    signal: AbortSignal,
  ): Promise<IExecutionOutcome> {
    // Build the descriptor. `permission` is forwarded from the tool
    // definition so `AuthorizeMiddleware` gates the dispatch through
    // the configured `IPermissionResolver` — AI tool calls flow through
    // the same auth surface as every other framework action. When the
    // tool definition omits `permission`, the middleware's existing
    // "no permission → skip authorize" behavior preserves headless
    // ergonomics for demo / dev use.
    const descriptor: IAiToolAction = {
      kind: ActionKind.AiTool,
      toolName,
      toolCallId,
      args: parsedArgs,
      ...(entry.definition.scope !== undefined ? { scope: entry.definition.scope } : {}),
      ...(entry.definition.permission !== undefined
        ? { permission: entry.definition.permission }
        : {}),
    };

    const response = await this.actionDispatcher!.dispatch<IAiToolAction, unknown>(descriptor, {
      signal,
    });

    // Cancellation cascaded to the handler → do not post any result.
    if (signal.aborted) return { aborted: true };

    if (response.success) {
      await this.safePostResult({ toolCallId, result: response.data });
      return { result: response.data };
    }
    const message = response.message ?? "AI tool failed";
    await this.safePostResult({ toolCallId, error: message });
    return { error: message };
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal
  // ────────────────────────────────────────────────────────────────────

  /**
   * Validate `args` against the tool's declared parameter schema.
   *
   * For zod schemas (both v3 + v4 expose `safeParse`), returns the parsed
   * value on success or an error message on failure. Non-zod schemas
   * pass through unvalidated.
   */
  private validateArgs(entry: IToolEntry, args: unknown): { parsed?: unknown; error?: string } {
    const schema = entry.definition.parameters;
    if (
      schema !== null &&
      typeof schema === "object" &&
      typeof (schema as { safeParse?: unknown }).safeParse === "function"
    ) {
      const parse = (
        schema as {
          safeParse: (v: unknown) => {
            success: boolean;
            data?: unknown;
            error?: { message?: string };
          };
        }
      ).safeParse;
      const result = parse.call(schema, args);
      if (result.success) return { parsed: result.data };
      const message = result.error?.message ?? "schema validation failed";
      return { error: `Invalid arguments for "${entry.definition.name}": ${message}` };
    }
    return { parsed: args };
  }

  /** Post a tool result, logging (but not rethrowing) transport failures. */
  private async safePostResult(result: IAiToolResult): Promise<void> {
    try {
      await this.client.postToolResult(result);
    } catch (err) {
      this.logger.warn("[ToolExecutor] failed to post tool result", {
        toolCallId: result.toolCallId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
