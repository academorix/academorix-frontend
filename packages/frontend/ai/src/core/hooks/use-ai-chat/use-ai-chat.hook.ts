/**
 * @file use-ai-chat.hook.ts
 * @module @stackra/ai/core/hooks
 * @description `useAiChat({ persona, threadId? })` — the primary hook
 *   for driving a chat session.
 *
 *   Composes the orchestrator + conversation store + connection manager
 *   to expose:
 *
 *   - `messages` — the live message list for the (auto-created) thread.
 *   - `status` — the orchestrator status.
 *   - `input` / `setInput` — controlled text input helpers.
 *   - `send(text?)` — send a user message (falls back to `input`).
 *   - `stop()` — cancel the active run.
 *   - `approveTool(id)` / `rejectTool(id)` — pass-through to the orchestrator.
 *   - `connection` — the composed connection state.
 *   - `canSubmit` — whether submission should be allowed (Req 24.6).
 *   - `error` — the last surfaced typed error.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInject } from "@stackra/container/react";
import {
  AI_CONNECTION_MANAGER,
  AI_CONVERSATION_STORE,
  AI_ORCHESTRATOR,
  type IAiMessage,
} from "@stackra/contracts";

import { ConnectionManager } from "@/core/services/connection-manager.service";
import { ConversationStore } from "@/core/services/conversation-store.service";
import {
  ChatOrchestrator,
  type IOrchestratorError,
  type OrchestratorStatus,
} from "@/core/services/chat-orchestrator.service";
import { useAiConnection, type IUseAiConnectionResult } from "../use-ai-connection";

/** Options accepted by {@link useAiChat}. */
export interface IUseAiChatOptions {
  /** Persona/agent slug. */
  persona: string;
  /**
   * Existing thread id to resume. When omitted, a fresh thread is
   * created lazily on the first `send`.
   */
  threadId?: string;
}

/** The value returned by {@link useAiChat}. */
export interface IUseAiChatResult {
  /** Live messages of the active thread. */
  messages: IAiMessage[];
  /** Current orchestrator status. */
  status: OrchestratorStatus;
  /** Controlled input value. */
  input: string;
  /** Update the controlled input. */
  setInput: (value: string) => void;
  /**
   * Send a message. If `text` is omitted, uses the current `input` and
   * clears it on submission.
   */
  send: (text?: string) => Promise<void>;
  /** Cancel the active run. */
  stop: () => Promise<void>;
  /** Approve a `RequiresAction` tool call. */
  approveTool: (toolCallId: string) => void;
  /** Reject a `RequiresAction` tool call. */
  rejectTool: (toolCallId: string) => void;
  /** Composed connection state. */
  connection: IUseAiConnectionResult;
  /** Whether submission should be allowed right now (Req 24.6). */
  canSubmit: boolean;
  /** Latest typed error surfaced by the orchestrator, if any. */
  error: IOrchestratorError | null;
  /** The active thread id (once one has been created). */
  threadId: string | null;
}

/**
 * Drive an AI chat session.
 */
export function useAiChat(options: IUseAiChatOptions): IUseAiChatResult {
  const orchestrator = useInject<ChatOrchestrator>(AI_ORCHESTRATOR);
  const store = useInject<ConversationStore>(AI_CONVERSATION_STORE);
  const connectionManager = useInject<ConnectionManager>(AI_CONNECTION_MANAGER);
  const connection = useAiConnection();

  const [threadId, setThreadId] = useState<string | null>(options.threadId ?? null);
  const [input, setInput] = useState<string>("");
  const [status, setStatus] = useState<OrchestratorStatus>(orchestrator.status);
  const [error, setError] = useState<IOrchestratorError | null>(null);
  const [messages, setMessages] = useState<IAiMessage[]>(() => currentMessages(store, threadId));

  // Subscribe to store changes → re-read messages.
  useEffect(() => {
    return store.onChange(() => setMessages(currentMessages(store, threadId)));
  }, [store, threadId]);

  // Subscribe to orchestrator status + errors.
  useEffect(() => {
    const offStatus = orchestrator.onStatusChange(setStatus);
    const offError = orchestrator.onError((e) => setError(e));
    return () => {
      offStatus();
      offError();
    };
  }, [orchestrator]);

  const send = useCallback(
    async (textOverride?: string): Promise<void> => {
      const text = (textOverride ?? input).trim();
      if (!text) return;
      if (!connectionManager.isConnected) return;

      // Ensure a thread exists.
      let activeThreadId = threadId;
      if (!activeThreadId) {
        activeThreadId = store.createThread({ personaSlug: options.persona });
        setThreadId(activeThreadId);
      }

      if (textOverride === undefined) setInput("");
      setError(null);
      try {
        await orchestrator.send({
          threadId: activeThreadId,
          persona: options.persona,
          message: text,
        });
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : String(err),
          recoverable: false,
        });
      }
    },
    [input, threadId, connectionManager, store, options.persona, orchestrator],
  );

  const stop = useCallback(() => orchestrator.stop(), [orchestrator]);
  const approveTool = useCallback((id: string) => orchestrator.approveTool(id), [orchestrator]);
  const rejectTool = useCallback((id: string) => orchestrator.rejectTool(id), [orchestrator]);

  const canSubmit = useMemo(
    () => connectionManager.isConnected && input.trim().length > 0,
    [connectionManager, input],
  );

  return {
    messages,
    status,
    input,
    setInput,
    send,
    stop,
    approveTool,
    rejectTool,
    connection,
    canSubmit,
    error,
    threadId,
  };
}

function currentMessages(store: ConversationStore, threadId: string | null): IAiMessage[] {
  if (!threadId) return [];
  return store.getThread(threadId)?.messages ?? [];
}
