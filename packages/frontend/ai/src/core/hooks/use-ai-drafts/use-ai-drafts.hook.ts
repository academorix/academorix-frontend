/**
 * @file use-ai-drafts.hook.ts
 * @module @stackra/ai/core/hooks
 * @description `useAiDrafts()` — list pending drafts + confirm them
 *   (Req 16).
 */

import { useCallback, useEffect, useState } from "react";
import { useInject } from "@stackra/container/react";
import { AI_DRAFT_SERVICE, type IAiDraft } from "@stackra/contracts";

import { DraftService } from "@/core/services/draft.service";

/** The value returned by {@link useAiDrafts}. */
export interface IUseAiDraftsResult {
  /** All tracked drafts. */
  drafts: IAiDraft[];
  /** Drafts still in the pending state. */
  pending: IAiDraft[];
  /** Confirm a pending draft. Throws on failure — see {@link AiDraftError}. */
  confirm: (draftId: string) => Promise<void>;
}

/**
 * Reactive snapshot of the draft-then-confirm queue.
 */
export function useAiDrafts(): IUseAiDraftsResult {
  const service = useInject<DraftService>(AI_DRAFT_SERVICE);
  const [snapshot, setSnapshot] = useState<Omit<IUseAiDraftsResult, "confirm">>(() =>
    build(service),
  );

  useEffect(() => {
    return service.onChange(() => setSnapshot(build(service)));
  }, [service]);

  const confirm = useCallback((id: string) => service.confirm(id), [service]);

  return { ...snapshot, confirm };
}

function build(service: DraftService): Omit<IUseAiDraftsResult, "confirm"> {
  return {
    drafts: service.all(),
    pending: service.pending(),
  };
}
