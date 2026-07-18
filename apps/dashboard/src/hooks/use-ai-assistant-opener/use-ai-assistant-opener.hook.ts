/**
 * @file use-ai-assistant-opener.hook.ts
 * @module @academorix/dashboard/hooks/use-ai-assistant-opener
 * @description Narrow hook for the navbar's Assistant icon.
 *
 *   Returns `{ open, close, isOpen }` — everything the navbar needs to
 *   toggle the sheet and reflect its pressed state. Callers that also
 *   need slot registration use {@link useAiAssistantSlot} instead.
 */

import { useSyncExternalStore } from "react";

import { useInject } from "@stackra/container/react";

import { AiAssistantService } from "@/services/ai-assistant";
import { AI_ASSISTANT_SERVICE } from "@/tokens/ai-assistant-service.token";

/** Result shape — matches the legacy `useAiAssistantOpener()`. */
export interface UseAiAssistantOpenerResult {
  /** Open the assistant sheet. Fires a toast fallback when no slot is registered. */
  open: () => void;
  /** Close the sheet. */
  close: () => void;
  /** Whether the sheet is currently open. */
  isOpen: boolean;
}

/**
 * Reads the open state + returns the imperative openers. Mount tree
 * independent — every subtree can call it because the state lives in
 * the DI container.
 *
 * @example
 * ```tsx
 * const { open, isOpen } = useAiAssistantOpener();
 * <Button aria-pressed={isOpen} onPress={open}>Assistant</Button>
 * ```
 */
export function useAiAssistantOpener(): UseAiAssistantOpenerResult {
  const service = useInject<AiAssistantService>(AI_ASSISTANT_SERVICE);
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);

  return {
    open: service.open,
    close: service.close,
    isOpen: snapshot.isOpen,
  };
}
