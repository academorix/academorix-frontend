/**
 * @file index.ts
 * @module @stackra/pwa/react/hooks/use-install-prompt
 * @description Entity barrel — re-exports the `useInstallPrompt` hook that
 *   captures the `beforeinstallprompt` event and exposes install / dismiss
 *   controls via its `IUseInstallPromptResult` return-shape interface.
 */

export { useInstallPrompt } from "./use-install-prompt.hook";
export type { IUseInstallPromptResult } from "./use-install-prompt.interface";
