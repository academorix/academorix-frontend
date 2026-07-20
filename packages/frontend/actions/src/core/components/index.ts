/**
 * @file index.ts
 * @module @stackra/actions/core/components
 * @description Public API barrel for cross-platform action components.
 *
 *   Every component re-exported here works on both React DOM and React
 *   Native. Web-only components (HeroUI-`Button`-based `<ActionButton>`)
 *   live under `../../react/components/`, not here.
 */

export { Action, enhanceActionChildProps } from "./action";
export type {
  EnhancedElement,
  IActionChildProps,
  IActionSlotProps,
  IEnhanceOptions,
  IEnhancedChildProps,
} from "./action";
