/**
 * @file index.ts
 * @module @stackra/pwa/react/hooks/use-vibration
 * @description Entity barrel — re-exports the `useVibration` hook that wraps
 *   `navigator.vibrate`, along with its `IUseVibrationResult` return-shape
 *   interface and `VibrationPattern` type.
 */

export {
  useVibration,
  type IUseVibrationResult,
  type VibrationPattern,
} from "./use-vibration.hook";
