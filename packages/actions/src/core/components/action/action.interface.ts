/**
 * @file action.interface.ts
 * @module @stackra/actions/core/components/action
 * @description Props + helper contracts for the `<Action>` polymorphic
 *   slot and its child-enhancement helper.
 *
 *   Interfaces are grouped in this single file per the React entity
 *   exception in `code-standards.md` — the four types below describe the
 *   same compound family (the slot component, its child contract, its
 *   caller-facing options, and the enhanced-child shape the helper
 *   returns).
 */

import type { ReactElement, ReactNode } from 'react';
import type { IActionContext, IActionDescriptor, IActionResponse } from '@stackra/contracts';

/**
 * Props accepted by the `<Action>` slot.
 *
 * @typeParam D - Descriptor variant being dispatched.
 * @typeParam R - Response data payload type.
 */
export interface IActionSlotProps<D extends IActionDescriptor = IActionDescriptor, R = unknown> {
  /** The action descriptor dispatched when the child's event fires. */
  readonly action: D;

  /** Optional caller context merged into every dispatch. */
  readonly context?: IActionContext;

  /**
   * Name of the event prop the slot injects onto its child. Defaults to
   * `'onPress'` (HeroUI / React Native). Set to `'onClick'` for plain
   * HTML pressables, or `'onChange'` for controlled inputs paired with
   * a caller-owned value.
   *
   * @default 'onPress'
   */
  readonly eventProp?: string;

  /** Callback fired after each dispatch resolves — success or failure. */
  readonly onDone?: (response: IActionResponse<R>, descriptor: D) => void;

  /**
   * Whether the slot injects `isPending` on the child while a dispatch
   * is in flight. HeroUI pressables consume `isPending` natively; set
   * `false` for children that don't support it.
   *
   * @default true
   */
  readonly forwardPending?: boolean;

  /**
   * Single React child — cloned by the slot with the event handler
   * and pending state injected.
   */
  readonly children: ReactNode;
}

/**
 * Subset of a child element's props that {@link enhanceActionChildProps}
 * reads or overrides.
 */
export interface IActionChildProps {
  /** Existing HeroUI / RN pressable handler, if any. */
  readonly onPress?: (...args: unknown[]) => unknown;

  /** Existing DOM click handler, if any. */
  readonly onClick?: (...args: unknown[]) => unknown;

  /** Existing controlled-input change handler, if any. */
  readonly onChange?: (...args: unknown[]) => unknown;

  /** Existing selection-change handler, if any. */
  readonly onSelectionChange?: (...args: unknown[]) => unknown;

  /** HeroUI pending marker. */
  readonly isPending?: boolean;

  /** HeroUI disabled marker. */
  readonly isDisabled?: boolean;

  /** DOM disabled marker. */
  readonly disabled?: boolean;

  /** Every other prop passes through untouched. */
  readonly [key: string]: unknown;
}

/**
 * Options accepted by {@link enhanceActionChildProps}. These mirror the
 * caller-facing surface of {@link IActionSlotProps} minus the child.
 */
export interface IEnhanceOptions<D extends IActionDescriptor = IActionDescriptor, R = unknown> {
  /** Event prop to inject on the child. */
  readonly eventProp?: string;

  /** Caller context merged into every dispatch. */
  readonly context?: IActionContext;

  /** Post-dispatch callback. */
  readonly onDone?: (response: IActionResponse<R>, descriptor: D) => void;

  /** Whether to inject `isPending` on the child. */
  readonly forwardPending?: boolean;
}

/**
 * Shape produced by {@link enhanceActionChildProps} — the child's props
 * with the action-driven handler and pending state merged in.
 */
export interface IEnhancedChildProps extends IActionChildProps {
  /** Effective pending state (child's own OR the slot's dispatch). */
  readonly isPending?: boolean;
}

/**
 * Return type of {@link enhanceActionChildProps} — a plain object
 * `React.cloneElement` accepts as the second argument.
 *
 * Kept as a discrete alias so consumers who compose the helper outside
 * of `<Action>` (rare) don't need to reach into the interfaces file.
 */
export type EnhancedElement<E extends ReactElement = ReactElement> = ReactElement<
  IEnhancedChildProps,
  E extends ReactElement<unknown, infer T> ? T : never
>;
