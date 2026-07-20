/**
 * @file index.ts
 * @module @stackra/actions/core/hooks
 * @description Public API barrel for the cross-platform action hooks.
 *
 *   Every hook re-exported here is safe on both React DOM and React
 *   Native — the DOM-specific `<ActionButton>` lives under
 *   `../../react/components/`, not here.
 */

export { useActionDispatcher, type ActionDispatchCallback } from './use-action-dispatcher';
export { useAction } from './use-action';
export type { IUseActionResult, IUseActionState } from './use-action';
export { useActionPress } from './use-action-press';
export type { IUseActionPressOptions, IUseActionPressResult } from './use-action-press';
export { useActionChange } from './use-action-change';
export type { ActionChangeMapper, IUseActionChangeResult } from './use-action-change';
export { useActionSelection } from './use-action-selection';
export type {
  ActionSelection,
  ActionSelectionMapper,
  IUseActionSelectionResult,
} from './use-action-selection';
