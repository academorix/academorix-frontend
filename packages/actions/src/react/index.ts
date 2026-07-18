/**
 * @file index.ts
 * @module @stackra/actions/react
 * @description React (DOM) surface of `@stackra/actions`.
 *
 *   Every cross-platform React hook + the `<Action>` slot lives in
 *   `../core/`. This subpath re-exports them alongside the web-only
 *   `<ActionButton>` (which depends on `@stackra/ui/react`'s `Button`).
 *
 *   For React Native, import from `@stackra/actions/native` instead.
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

// ─── Web-only components (depend on `@stackra/ui/react`) ─────────────
export { ActionButton, type IActionButtonProps } from './components';
