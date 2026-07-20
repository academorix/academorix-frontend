/**
 * @file conversation-store.service.ts
 * @module @stackra/ai/core/services
 * @description Local cache of conversation threads + their ordered
 *   messages. The backend is the source of truth (Req 17.6); this store
 *   holds the last-known state for responsive rendering.
 *
 *   Requirement traceability:
 *
 *   - 17.1 — maintain conversation state as an ordered sequence of
 *            messages per thread.
 *   - 17.2 — append `text-delta` events to the current assistant message.
 *   - 17.3 — list available threads.
 *   - 17.4 — select an active thread.
 *   - 17.5 — the message count after appending a message equals the
 *            prior count plus one (invariant, Property 10).
 *   - 17.6 — backend persistence is the source of truth; local store is
 *            a cache.
 */

import { Injectable, Optional, Inject } from "@stackra/container";
import { Logger } from "@stackra/logger";
import {
  AiRunStatus,
  AiToolState,
  EVENT_EMITTER,
  type IAiConversation,
  type IAiMessage,
  type IAiSource,
  type IAiThreadSummary,
  type IAiToolCall,
  type IEventEmitter,
} from "@stackra/contracts";

/** Options for creating a new thread. */
export interface ICreateThreadOptions {
  /** Optional pre-assigned thread id. When omitted, a fresh id is minted. */
  threadId?: string;
  /** The persona/agent slug scoping this thread. */
  personaSlug: string;
}

/**
 * ConversationStore — Requirement 17.
 */
@Injectable()
export class ConversationStore {
  private readonly logger = new Logger(ConversationStore.name);

  /** Thread id → conversation. */
  private readonly threads = new Map<string, IAiConversation>();

  /** Active thread id, when a selection is in effect. */
  private activeId: string | null = null;

  /** Listener subscribers. */
  private readonly listeners = new Set<() => void>();

  public constructor(@Optional() @Inject(EVENT_EMITTER) private readonly _events?: IEventEmitter) {
    // `_events` reserved for future emissions (e.g. `THREAD_UPDATED`).
    void this._events;
  }

  // ────────────────────────────────────────────────────────────────────
  // Threads
  // ────────────────────────────────────────────────────────────────────

  /** Create a new thread and return its id. */
  public createThread(options: ICreateThreadOptions): string {
    const threadId = options.threadId ?? this.mintId("thread");
    const conversation: IAiConversation = {
      threadId,
      personaSlug: options.personaSlug,
      messages: [],
      status: AiRunStatus.Pending,
    };
    this.threads.set(threadId, conversation);
    if (this.activeId === null) this.activeId = threadId;
    this.notify();
    return threadId;
  }

  /** Fetch a thread by id. */
  public getThread(threadId: string): IAiConversation | undefined {
    return this.threads.get(threadId);
  }

  /** Set (or replace) the full conversation for a thread (used on hydration). */
  public setThread(conversation: IAiConversation): void {
    this.threads.set(conversation.threadId, conversation);
    this.notify();
  }

  /** Snapshot summary of every thread. */
  public listThreads(): IAiThreadSummary[] {
    return Array.from(this.threads.values()).map((thread) => ({
      threadId: thread.threadId,
      title: this.firstUserText(thread) ?? "New conversation",
      preview: this.lastAssistantText(thread) ?? "",
      updatedAt: thread.messages[thread.messages.length - 1]?.createdAt ?? Date.now(),
    }));
  }

  /** Currently-active thread id. */
  public getActiveId(): string | null {
    return this.activeId;
  }

  /** Currently-active conversation, when one is selected. */
  public getActive(): IAiConversation | null {
    return this.activeId === null ? null : (this.threads.get(this.activeId) ?? null);
  }

  /** Select the active thread. */
  public setActive(threadId: string): void {
    if (!this.threads.has(threadId)) {
      this.logger.warn(`[ConversationStore] setActive: unknown thread "${threadId}"`);
      return;
    }
    this.activeId = threadId;
    this.notify();
  }

  /** Remove a thread. */
  public deleteThread(threadId: string): void {
    if (!this.threads.delete(threadId)) return;
    if (this.activeId === threadId) this.activeId = null;
    this.notify();
  }

  // ────────────────────────────────────────────────────────────────────
  // Messages
  // ────────────────────────────────────────────────────────────────────

  /**
   * Append a user message. Returns the message id.
   *
   * Enforces the count invariant (Req 17.5, Property 10): after this
   * call the thread's messages length is `prior + 1`.
   */
  public appendUser(threadId: string, text: string): string {
    const id = this.mintId("msg");
    this.appendMessage(threadId, {
      id,
      role: "user",
      text,
      toolCalls: [],
      createdAt: Date.now(),
    });
    return id;
  }

  /** Append an empty assistant message (delta target). */
  public startAssistantMessage(threadId: string, messageId?: string): string {
    const id = messageId ?? this.mintId("msg");
    this.appendMessage(threadId, {
      id,
      role: "assistant",
      text: "",
      toolCalls: [],
      createdAt: Date.now(),
    });
    this.updateStatus(threadId, AiRunStatus.Streaming);
    return id;
  }

  /**
   * Append a `text-delta` fragment to a specific assistant message
   * (Req 17.2).
   */
  public appendTextDelta(threadId: string, messageId: string, delta: string): void {
    const thread = this.threads.get(threadId);
    if (!thread) return;
    const message = thread.messages.find((m) => m.id === messageId);
    if (!message) return;
    message.text = message.text + delta;
    this.notify();
  }

  /** Mark an assistant message as completed. */
  public finishAssistantMessage(threadId: string, _messageId: string): void {
    this.updateStatus(threadId, AiRunStatus.Completed);
    // `_messageId` reserved for future per-message completion events.
    void _messageId;
  }

  /** Attach a source citation to a message. */
  public addSource(threadId: string, messageId: string, source: IAiSource): void {
    const thread = this.threads.get(threadId);
    const message = thread?.messages.find((m) => m.id === messageId);
    if (!message) return;
    message.sources = message.sources ? [...message.sources, source] : [source];
    this.notify();
  }

  // ────────────────────────────────────────────────────────────────────
  // Tool calls
  // ────────────────────────────────────────────────────────────────────

  /**
   * Register a decoded tool call against a message. If a tool call with
   * the same id already exists, this method is a no-op — use
   * {@link updateToolCall} to mutate one.
   */
  public addToolCall(threadId: string, messageId: string, toolCall: IAiToolCall): void {
    const thread = this.threads.get(threadId);
    const message = thread?.messages.find((m) => m.id === messageId);
    if (!message) return;
    if (message.toolCalls.some((t) => t.toolCallId === toolCall.toolCallId)) return;
    message.toolCalls = [...message.toolCalls, toolCall];
    this.notify();
  }

  /** Update the render state or result of an existing tool call. */
  public updateToolCall(
    threadId: string,
    messageId: string,
    toolCallId: string,
    updates: Partial<IAiToolCall>,
  ): void {
    const thread = this.threads.get(threadId);
    const message = thread?.messages.find((m) => m.id === messageId);
    if (!message) return;
    let mutated = false;
    message.toolCalls = message.toolCalls.map((t) => {
      if (t.toolCallId !== toolCallId) return t;
      mutated = true;
      return { ...t, ...updates };
    });
    if (mutated) this.notify();
  }

  /**
   * Set a tool call's state directly. Convenience over {@link updateToolCall}
   * for callers that only need the state transition (e.g. `RequiresAction`).
   */
  public setToolCallState(
    threadId: string,
    messageId: string,
    toolCallId: string,
    state: AiToolState,
  ): void {
    this.updateToolCall(threadId, messageId, toolCallId, { state });
  }

  // ────────────────────────────────────────────────────────────────────
  // Change notification
  // ────────────────────────────────────────────────────────────────────

  /** Subscribe to any change in the store. */
  public onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal
  // ────────────────────────────────────────────────────────────────────

  /** Append a message to a thread, enforcing the count invariant. */
  private appendMessage(threadId: string, message: IAiMessage): void {
    const thread = this.threads.get(threadId);
    if (!thread) {
      this.logger.warn(`[ConversationStore] appendMessage: unknown thread "${threadId}"`);
      return;
    }
    thread.messages = [...thread.messages, message];
    this.notify();
  }

  private updateStatus(threadId: string, status: AiRunStatus): void {
    const thread = this.threads.get(threadId);
    if (!thread || thread.status === status) return;
    thread.status = status;
    this.notify();
  }

  private firstUserText(thread: IAiConversation): string | undefined {
    return thread.messages.find((m) => m.role === "user")?.text;
  }

  private lastAssistantText(thread: IAiConversation): string | undefined {
    for (let i = thread.messages.length - 1; i >= 0; i--) {
      const m = thread.messages[i]!;
      if (m.role === "assistant") return m.text;
    }
    return undefined;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        this.logger.warn("[ConversationStore] change listener threw", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  private mintId(prefix: string): string {
    // Compact, monotonic-ish id — sufficient for a local cache. Backend
    // ids override on hydration.
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
