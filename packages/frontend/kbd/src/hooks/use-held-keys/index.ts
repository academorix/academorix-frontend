/**
 * @file index.ts
 * @module @stackra/kbd/hooks/use-held-keys
 * @description Entity barrel — re-exports the `useHeldKeys` hook (tracks
 *   the set of currently-pressed keys) and the `useKeyHold` variant that
 *   fires a callback while a specific key stays held.
 */

export { useHeldKeys, useKeyHold } from "./use-held-keys.hook";
