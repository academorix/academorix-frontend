/**
 * @file ai-assistant-service.token.ts
 * @module @academorix/dashboard/tokens
 * @description Injection token for {@link AiAssistantService} — the app-
 *   wide AI Assistant sheet controller. Consumers read + drive state via
 *   `useAiAssistantOpener()` and `useAiAssistantSlot()`; the sheet mount
 *   itself (`<AiAssistantSheetMount />`) subscribes via
 *   `useSyncExternalStore`.
 */

/** DI token bound to `AiAssistantService`. */
export const AI_ASSISTANT_SERVICE: unique symbol = Symbol("AI_ASSISTANT_SERVICE");
