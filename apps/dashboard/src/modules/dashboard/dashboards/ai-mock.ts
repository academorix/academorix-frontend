/**
 * @file ai-mock.ts
 * @module modules/dashboard/dashboards/ai-mock
 *
 * @description
 * Backward-compat shim. The AI copilot mock now lives in
 * `@stackra/dashboard` — this file re-exports `askAssistant` +
 * `AI_SUGGESTED_PROMPTS` so existing app imports keep resolving.
 *
 * When we refactor `ai-copilot-tab.tsx` to import from
 * `@stackra/dashboard` directly, delete this file.
 */

export { AI_SUGGESTED_PROMPTS, askAssistant } from "@/modules/dashboard/dashboards";
