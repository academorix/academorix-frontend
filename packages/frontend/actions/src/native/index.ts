/**
 * @file index.ts
 * @module @stackra/actions/native
 * @description React Native surface of `@stackra/actions`.
 *
 *   Re-exports every cross-platform hook + the `<Action>` slot from
 *   `../core/`. Deliberately omits `<ActionButton>` (which depends on
 *   HeroUI's `Button` from `@stackra/ui/react` — the DOM surface) —
 *   RN consumers compose `<Action>` over a `Pressable` or
 *   HeroUI-Native's `Button`.
 *
 * @example
 * ```tsx
 * import { Action, useActionDispatcher } from '@stackra/actions/native';
 * import { Pressable, Text } from 'react-native';
 *
 * function SaveButton() {
 *   return (
 *     <Action action={{ kind: 'toast', message: 'Saved' }}>
 *       <Pressable><Text>Save</Text></Pressable>
 *     </Action>
 *   );
 * }
 * ```
 */

// ─── Cross-platform hooks (source of truth: ../core/hooks) ───────────
export {
  useActionDispatcher,
  useAction,
  useActionPress,
  useActionChange,
  useActionSelection,
  type ActionDispatchCallback,
  type ActionChangeMapper,
  type ActionSelection,
  type ActionSelectionMapper,
  type IUseActionChangeResult,
  type IUseActionPressOptions,
  type IUseActionPressResult,
  type IUseActionResult,
  type IUseActionSelectionResult,
  type IUseActionState,
} from '../core/hooks';

// ─── Cross-platform components (source of truth: ../core/components) ─
export {
  Action,
  enhanceActionChildProps,
  type EnhancedElement,
  type IActionChildProps,
  type IActionSlotProps,
  type IEnhanceOptions,
  type IEnhancedChildProps,
} from '../core/components';
