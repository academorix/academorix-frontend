/**
 * @file chat-orchestrator.service.ts
 * @module @stackra/ai/core/services
 * @description The glue between transport events, the conversation store,
 *   and the tool executor. `useAiChat` talks to this.
 *
 *   Flow:
 *
 *   1. `send(threadId, persona, message)` builds an `IAiChatRequest`
 *      carrying the current converted client-tool definitions (piggyback
 *      advertisement, design decision) and opens `client.chat(...)`.
 *   2. Iterate decoded {@link IAiStreamEvent}s:
 *      - Text events append to the store's assistant message.
 *      - Tool-call events accumulate arg fragments and update tool state.
 *      - Tool-call-end triggers `ToolExecutor.execute(...)` for client
 *        tools with approval routed through this orchestrator's
 *        `approveTool`/`rejectTool` hooks.
 *      - Tool-result events update state for server tools.
 *      - Finish resets backoff and closes the assistant message.
 *      - Error surfaces via `onError`.
 *   3. `stop()` aborts the current run and calls `client.cancelRun`.
 *
 *   Requirement traceability:
 *
 *   - 8.5 — assemble streamed `tool-call-delta` fragments before invocation.
 *   - 9.2/9.3 — proceed / cancel on approval decision.
 *   - 15.2 — surface decoded events to consumers incrementally (via the store).
 *   - 15.4 — surface a typed error on transport failure.
 *   - 17.2 — append text-delta to the current assistant message.
 *   - 24.4 — cache runId + assistant message ids so a resume avoids duplication.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { Logger } from "@stackra/logger";
import {
  AI_CLIENT,
  AI_CONNECTION_MANAGER,
  AI_CONVERSATION_STORE,
  AI_EVENTS,
  AI_TOOL_CONVERTER,
  AI_TOOL_EXECUTOR,
  AiRunStatus,
  AiStreamEventType,
  AiToolState,
  EVENT_EMITTER,
  type IAiChatRequest,
  type IAiClient,
  type IAiStreamEvent,
  type IAiToolCall,
  type IEventEmitter,
} from "@stackra/contracts";

import { AiTransportError } from "../errors";
import { ConnectionManager } from "./connection-manager.service";
import { ConversationStore } from "./conversation-store.service";
import { ToolConverter } from "./tool-converter.service";
import { ToolExecutor } from "./tool-executor.service";

/** Options for `send()`. */
export interface ISendOptions {
  /** Conversation thread to append to. */
  threadId: string;
  /** Persona/agent slug. */
  persona: string;
  /** User message text. */
  message: string;
}

/** Observable status of the orchestrator. */
export type OrchestratorStatus = "idle" | "streaming" | "complete" | "error" | "cancelled";

/** Error surfaced via `onError`. */
export interface IOrchestratorError {
  /** Human-readable message. */
  message: string;
  /** Whether the backend flagged the error as recoverable. */
  recoverable: boolean;
}

/**
 * ChatOrchestrator — Requirement 15 + 8.5 + 9.
 */
@Injectable()
export class ChatOrchestrator {
  private readonly logger = new Logger(ChatOrchestrator.name);

  /** Active run bookkeeping — non-null while a stream is in flight. */
  private currentRun: {
    threadId: string;
    assistantMessageId: string;
    controller: AbortController;
    argsBuffer: Map<string, string>;
    toolCallMessageIds: Map<string, string>;
    approvalWaits: Map<string, { resolve: (v: boolean) => void }>;
    runId?: string;
  } | null = null;

  /** Public orchestrator status. */
  private _status: OrchestratorStatus = "idle";

  private readonly statusListeners = new Set<(status: OrchestratorStatus) => void>();
  private readonly errorListeners = new Set<(error: IOrchestratorError) => void>();

  public constructor(
    @Inject(AI_CLIENT) private readonly client: IAiClient,
    @Inject(AI_CONVERSATION_STORE) private readonly store: ConversationStore,
    @Inject(AI_TOOL_EXECUTOR) private readonly toolExecutor: ToolExecutor,
    @Inject(AI_TOOL_CONVERTER) private readonly toolConverter: ToolConverter,
    @Optional() @Inject(AI_CONNECTION_MANAGER) private readonly connection?: ConnectionManager,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter,
  ) {}

  // ────────────────────────────────────────────────────────────────────
  // Observable state
  // ────────────────────────────────────────────────────────────────────

  /** Current orchestrator status. */
  public get status(): OrchestratorStatus {
    return this._status;
  }

  /** Subscribe to status changes. */
  public onStatusChange(listener: (status: OrchestratorStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /** Subscribe to typed errors surfaced by the run. */
  public onError(listener: (error: IOrchestratorError) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  // ────────────────────────────────────────────────────────────────────
  // Send / stop
  // ────────────────────────────────────────────────────────────────────

  /**
   * Send a user message and drive the resulting assistant stream.
   *
   * Resolves when the stream terminates (finish, error, or cancellation).
   * A second `send` while one is in flight throws.
   */
  public async send(options: ISendOptions): Promise<void> {
    if (this.currentRun) {
      throw new Error("[ChatOrchestrator] a run is already in progress; call stop() first");
    }

    // ── Append the user message + prime an assistant message. ──────────
    this.store.appendUser(options.threadId, options.message);
    const assistantId = this.store.startAssistantMessage(options.threadId);

    const controller = new AbortController();
    this.currentRun = {
      threadId: options.threadId,
      assistantMessageId: assistantId,
      controller,
      argsBuffer: new Map(),
      toolCallMessageIds: new Map(),
      approvalWaits: new Map(),
    };
    this.setStatus("streaming");
    void this.events?.emit(AI_EVENTS.STREAM_STARTED, {
      threadId: options.threadId,
      persona: options.persona,
    });

    // ── Build the request (tools piggyback per design decision). ───────
    const request: IAiChatRequest = {
      persona: options.persona,
      threadId: options.threadId,
      message: options.message,
      tools: this.toolConverter.currentDefinitions(),
    };

    const iterable = this.client.chat(options.persona, request, controller.signal);
    try {
      for await (const event of iterable) {
        await this.handleEvent(event);
      }
      // Iterator ended without a `finish` event — treat as complete.
      if (this._status === "streaming") this.completeRun();
    } catch (err) {
      this.failRun(err);
      throw err;
    } finally {
      void this.events?.emit(AI_EVENTS.STREAM_ENDED, {
        threadId: options.threadId,
        persona: options.persona,
      });
    }
  }

  /**
   * Cancel the active run. Aborts the transport, cancels backend runs
   * that have advertised a `runId`, and settles pending approvals as
   * rejections so the executor unwinds cleanly.
   */
  public async stop(): Promise<void> {
    const run = this.currentRun;
    if (!run) return;
    run.controller.abort();
    // Resolve any pending approvals as rejections so executor promises
    // don't dangle.
    for (const [, wait] of run.approvalWaits) wait.resolve(false);
    run.approvalWaits.clear();

    if (run.runId) {
      try {
        await this.client.cancelRun(run.runId);
      } catch (err) {
        this.logger.warn("[ChatOrchestrator] cancelRun failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    this.setStatus("cancelled");
    this.currentRun = null;
  }

  /** Approve a pending tool call. */
  public approveTool(toolCallId: string): void {
    const wait = this.currentRun?.approvalWaits.get(toolCallId);
    if (!wait) return;
    this.currentRun!.approvalWaits.delete(toolCallId);
    wait.resolve(true);
  }

  /** Reject a pending tool call. */
  public rejectTool(toolCallId: string): void {
    const wait = this.currentRun?.approvalWaits.get(toolCallId);
    if (!wait) return;
    this.currentRun!.approvalWaits.delete(toolCallId);
    wait.resolve(false);
  }

  // ────────────────────────────────────────────────────────────────────
  // Event routing
  // ────────────────────────────────────────────────────────────────────

  private async handleEvent(event: IAiStreamEvent): Promise<void> {
    const run = this.currentRun;
    if (!run) return;

    switch (event.type) {
      case AiStreamEventType.TextStart:
        // Assistant message already started in `send()` — nothing to do.
        return;

      case AiStreamEventType.TextDelta:
        this.store.appendTextDelta(run.threadId, run.assistantMessageId, event.delta);
        return;

      case AiStreamEventType.TextEnd:
        return;

      case AiStreamEventType.ToolCallStart:
        this.onToolCallStart(event.toolCallId, event.toolName);
        return;

      case AiStreamEventType.ToolCallDelta:
        this.onToolCallDelta(event.toolCallId, event.argsTextDelta);
        return;

      case AiStreamEventType.ToolCallEnd:
        await this.onToolCallEnd(event.toolCallId, event.args);
        return;

      case AiStreamEventType.ToolResult:
        this.onServerToolResult(event.toolCallId, event.result, event.isError);
        return;

      case AiStreamEventType.Finish:
        if (event.runId) run.runId = event.runId;
        this.completeRun();
        return;

      case AiStreamEventType.Error:
        this.dispatchError({ message: event.message, recoverable: event.recoverable });
        if (!event.recoverable) this.failRun(new AiTransportError(event.message));
        return;
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Tool-call state transitions
  // ────────────────────────────────────────────────────────────────────

  private onToolCallStart(toolCallId: string, toolName: string): void {
    const run = this.currentRun!;
    const origin = this.toolExecutor.isClientTool(toolName) ? "client" : "server";
    const toolCall: IAiToolCall = {
      toolCallId,
      toolName,
      state: AiToolState.InputStreaming,
      origin,
      requiresApproval: false,
    };
    this.store.addToolCall(run.threadId, run.assistantMessageId, toolCall);
    run.toolCallMessageIds.set(toolCallId, run.assistantMessageId);
    run.argsBuffer.set(toolCallId, "");
    void this.events?.emit(AI_EVENTS.TOOL_CALLED, { toolCallId, toolName });
  }

  private onToolCallDelta(toolCallId: string, delta: string): void {
    const run = this.currentRun!;
    const buffer = run.argsBuffer.get(toolCallId);
    if (buffer === undefined) return;
    const updated = buffer + delta;
    run.argsBuffer.set(toolCallId, updated);
    const messageId = run.toolCallMessageIds.get(toolCallId);
    if (messageId) {
      this.store.updateToolCall(run.threadId, messageId, toolCallId, { argsText: updated });
    }
  }

  private async onToolCallEnd(toolCallId: string, args: unknown): Promise<void> {
    const run = this.currentRun!;
    const messageId = run.toolCallMessageIds.get(toolCallId);
    if (!messageId) return;

    this.store.updateToolCall(run.threadId, messageId, toolCallId, {
      args,
      state: AiToolState.InputAvailable,
    });

    // Route to the executor. Client-tool classification happens inside
    // the executor; server tools return `{ serverTool: true }` and this
    // orchestrator just waits for the paired `tool-result` event.
    const toolName = this.readToolName(run.threadId, messageId, toolCallId);
    const outcome = await this.toolExecutor.execute(toolCallId, toolName, args, {
      waitForApproval: () => this.waitForApproval(toolCallId, messageId),
      signal: run.controller.signal,
    });

    // Update state based on executor outcome. Server tools are a no-op
    // here — the backend will emit `tool-result` which updates state.
    if (outcome.serverTool) return;

    if (outcome.aborted) {
      this.store.updateToolCall(run.threadId, messageId, toolCallId, {
        state: AiToolState.OutputError,
        error: "cancelled",
      });
      void this.events?.emit(AI_EVENTS.TOOL_RESULT, { toolCallId, cancelled: true });
      return;
    }

    if (outcome.rejected) {
      this.store.updateToolCall(run.threadId, messageId, toolCallId, {
        state: AiToolState.OutputError,
        error: "rejected",
      });
      void this.events?.emit(AI_EVENTS.TOOL_RESULT, { toolCallId, rejected: true });
      return;
    }

    if (outcome.error !== undefined) {
      this.store.updateToolCall(run.threadId, messageId, toolCallId, {
        state: AiToolState.OutputError,
        error: outcome.error,
      });
    } else {
      this.store.updateToolCall(run.threadId, messageId, toolCallId, {
        state: AiToolState.OutputAvailable,
        result: outcome.result,
      });
    }
    void this.events?.emit(AI_EVENTS.TOOL_RESULT, { toolCallId, result: outcome.result });
  }

  private onServerToolResult(toolCallId: string, result: unknown, isError: boolean): void {
    const run = this.currentRun!;
    const messageId = run.toolCallMessageIds.get(toolCallId);
    if (!messageId) return;
    this.store.updateToolCall(run.threadId, messageId, toolCallId, {
      state: isError ? AiToolState.OutputError : AiToolState.OutputAvailable,
      result: isError ? undefined : result,
      error: isError ? String(result) : undefined,
    });
    void this.events?.emit(AI_EVENTS.TOOL_RESULT, { toolCallId, result });
  }

  /**
   * Approval-wait hook wired into the executor. Marks the tool call as
   * `RequiresAction` in the store so the UI can render the prompt, then
   * awaits `approveTool` / `rejectTool`.
   */
  private waitForApproval(toolCallId: string, messageId: string): Promise<boolean> {
    const run = this.currentRun!;
    this.store.updateToolCall(run.threadId, messageId, toolCallId, {
      state: AiToolState.RequiresAction,
      requiresApproval: true,
    });
    return new Promise<boolean>((resolve) => {
      run.approvalWaits.set(toolCallId, { resolve });
    });
  }

  /** Look up the tool name from the store for a given tool call. */
  private readToolName(threadId: string, messageId: string, toolCallId: string): string {
    const thread = this.store.getThread(threadId);
    const message = thread?.messages.find((m) => m.id === messageId);
    const call = message?.toolCalls.find((c) => c.toolCallId === toolCallId);
    return call?.toolName ?? "";
  }

  // ────────────────────────────────────────────────────────────────────
  // Run lifecycle
  // ────────────────────────────────────────────────────────────────────

  private completeRun(): void {
    const run = this.currentRun;
    if (!run) return;
    this.store.finishAssistantMessage(run.threadId, run.assistantMessageId);
    this.connection?.noteRunFinished();
    this.setStatus("complete");
    this.currentRun = null;
  }

  private failRun(err: unknown): void {
    const run = this.currentRun;
    if (run) {
      // Mark the thread as failed via a direct status write on the
      // hydrated conversation reference. `setThread` would be heavier —
      // we only need the status field to reflect the failure.
      const thread = this.store.getThread(run.threadId);
      if (thread) thread.status = AiRunStatus.Failed;
    }
    this.setStatus("error");
    this.dispatchError({
      message: err instanceof Error ? err.message : String(err),
      recoverable: false,
    });
    this.currentRun = null;
  }

  private setStatus(next: OrchestratorStatus): void {
    if (this._status === next) return;
    this._status = next;
    for (const listener of this.statusListeners) {
      try {
        listener(next);
      } catch (err) {
        this.logger.warn("[ChatOrchestrator] status listener threw", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  private dispatchError(error: IOrchestratorError): void {
    for (const listener of this.errorListeners) {
      try {
        listener(error);
      } catch (err) {
        this.logger.warn("[ChatOrchestrator] error listener threw", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}
