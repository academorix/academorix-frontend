/**
 * @file index.ts
 * @module @stackra/kbd/hooks/use-hotkey-recorder
 * @description Entity barrel — re-exports the `useShortcutRecorder` hook
 *   that captures a user-pressed chord and its `UseShortcutRecorderResult`
 *   return-shape interface.
 */

export { useShortcutRecorder } from "./use-hotkey-recorder.hook";
export type { UseShortcutRecorderResult } from "./use-hotkey-recorder.hook";
