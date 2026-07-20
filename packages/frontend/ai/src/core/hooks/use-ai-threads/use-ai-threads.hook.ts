/**
 * @file use-ai-threads.hook.ts
 * @module @stackra/ai/core/hooks
 * @description `useAiThreads()` — list available threads + select the
 *   active one (Req 17.3, 17.4).
 */

import { useCallback, useEffect, useState } from "react";
import { useInject } from "@stackra/container/react";
import { AI_CONVERSATION_STORE, type IAiThreadSummary } from "@stackra/contracts";

import { ConversationStore } from "@/core/services/conversation-store.service";

/** The value returned by {@link useAiThreads}. */
export interface IUseAiThreadsResult {
  /** Every thread's summary. */
  threads: IAiThreadSummary[];
  /** Currently-selected thread id. */
  activeId: string | null;
  /** Select a thread (sets it active). */
  select: (threadId: string) => void;
}

/**
 * Reactive list of conversation threads.
 */
export function useAiThreads(): IUseAiThreadsResult {
  const store = useInject<ConversationStore>(AI_CONVERSATION_STORE);
  const [snapshot, setSnapshot] = useState<{
    threads: IAiThreadSummary[];
    activeId: string | null;
  }>(() => build(store));

  useEffect(() => {
    return store.onChange(() => setSnapshot(build(store)));
  }, [store]);

  const select = useCallback((threadId: string) => store.setActive(threadId), [store]);

  return { threads: snapshot.threads, activeId: snapshot.activeId, select };
}

function build(store: ConversationStore): { threads: IAiThreadSummary[]; activeId: string | null } {
  return {
    threads: store.listThreads(),
    activeId: store.getActiveId(),
  };
}
