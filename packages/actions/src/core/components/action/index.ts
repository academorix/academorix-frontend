/**
 * @file index.ts
 * @module @stackra/actions/core/components/action
 * @description Public API barrel for the `<Action>` entity.
 */

export { Action } from './action.component';
export { enhanceActionChildProps } from './enhance-child-props.util';
export type {
  EnhancedElement,
  IActionChildProps,
  IActionSlotProps,
  IEnhanceOptions,
  IEnhancedChildProps,
} from './action.interface';
