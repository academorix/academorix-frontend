/**
 * @file use-ai-conversation.hook.ts
 * @module @stackra/ai/core/hooks
 * @description `useAiConversation(threadId?)` — reactive snapshot of a
 *   single conversation thread. When `threadId` is omitted the hook
 *   returns the currently-active thread.
 */

import { useEffect, useState } from 'react';
import { useInject } from '@stackra/container/react';
import { AI_CONVERSATION_STORE, type IAiConversation } from '@stackra/contracts';

import { ConversationStore } from '@/core/services/conversation-store.service';

/** The value returned by {@link useAiConversation}. */
export interface IUseAiConversationResult {
  /** The active or specified conversation, or `null`. */
  conversation: IAiConversation | null;
  /** Convenience alias for `conversation?.messages ?? []`. */
  messages: IAiConversation['messages'];
  /** Currently-active thread id. */
  activeThreadId: string | null;
}

/**
 * Subscribe to a single conversation.
 *
 * @param threadId - Thread to observe. Omit for the active thread.
 */
export function useAiConversation(threadId?: string): IUseAiConversationResult {
  const store = useInject<ConversationStore>(AI_CONVERSATION_STORE);
  const [snapshot, setSnapshot] = useState<IUseAiConversationResult>(() => build(store, threadId));

  useEffect(() => {
    return store.onChange(() => setSnapshot(build(store, threadId)));
  }, [store, threadId]);

  return snapshot;
}

function build(store: ConversationStore, threadId?: string): IUseAiConversationResult {
  const conversation = threadId ? (store.getThread(threadId) ?? null) : store.getActive();
  return {
    conversation,
    messages: conversation?.messages ?? [],
    activeThreadId: store.getActiveId(),
  };
}
