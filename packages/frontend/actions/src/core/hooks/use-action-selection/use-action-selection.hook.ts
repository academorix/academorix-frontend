/**
 * @file use-action-selection.hook.ts
 * @module @stackra/actions/core/hooks/use-action-selection
 * @description `useActionSelection(descriptor, mapper, options?)` — bind
 *   a descriptor to an `onSelectionChange` handler for HeroUI's
 *   selection widgets (`Select`, `ListBox`, `RadioGroup`, `TagGroup`).
 */

import { useCallback } from 'react';
import type { IActionDescriptor, IActionResponse } from '@stackra/contracts';

import { useAction } from '../use-action';
import type { IUseActionPressOptions } from '../use-action-press/use-action-press.interface';
import type { ActionSelection, ActionSelectionMapper } from './use-action-selection.type';

/**
 * Result of {@link useActionSelection} — an `onSelectionChange` handler
 * + state.
 *
 * @typeParam K - Selection key type.
 * @typeParam R - Response data payload type.
 */
export interface IUseActionSelectionResult<
  K extends string | number = string | number,
  R = unknown,
> {
  /**
   * `onSelectionChange(selection)` handler compatible with HeroUI's
   * `Select` / `ListBox` / `RadioGroup` / `TagGroup` and React Aria
   * Components.
   */
  readonly onSelectionChange: (selection: ActionSelection<K>) => Promise<IActionResponse<R>>;

  /** Whether an invocation is currently in flight. */
  readonly isPending: boolean;

  /** Failure message from the most recent run, or `null`. */
  readonly error: string | null;

  /** Reset the reactive state. */
  readonly reset: () => void;
}

/**
 * Bind a descriptor + a selection-to-descriptor `mapper` to an
 * `onSelectionChange` handler suitable for HeroUI's selection widgets.
 *
 * @typeParam K - Selection key type.
 * @typeParam D - Descriptor variant to dispatch.
 * @typeParam R - Response data payload type.
 * @param base - The base descriptor to merge each new selection into.
 * @param mapper - Function producing the final descriptor given the selection.
 * @param options - Optional caller context + done-callback.
 * @returns Stable `onSelectionChange` handler + pending state.
 *
 * @example
 * ```tsx
 * import { useActionSelection } from '@stackra/actions/react';
 *
 * function TenantSwitcher() {
 *   const { onSelectionChange } = useActionSelection<string, ISetStateAction>(
 *     { kind: 'setState', path: 'tenant', value: null },
 *     (sel, base) => {
 *       const value = sel === 'all' ? '*' : [...sel][0] ?? null;
 *       return { ...base, value };
 *     },
 *   );
 *   return <Select onSelectionChange={onSelectionChange}>...</Select>;
 * }
 * ```
 */
export function useActionSelection<
  K extends string | number = string | number,
  D extends IActionDescriptor = IActionDescriptor,
  R = unknown,
>(
  base: D,
  mapper: ActionSelectionMapper<K, D>,
  options: IUseActionPressOptions<D, R> = {}
): IUseActionSelectionResult<K, R> {
  const { run, reset, isPending, error } = useAction<D, R>(base.kind);
  const { context, onDone } = options;

  const onSelectionChange = useCallback(
    async (selection: ActionSelection<K>): Promise<IActionResponse<R>> => {
      // Delegate the selection→descriptor projection to caller-owned
      // mapper — the framework has no opinion on whether a multi-select
      // should collapse to the first, all, or a comma-joined value.
      const descriptor = mapper(selection, base);
      const result = await run(descriptor, context);
      onDone?.(result, descriptor);
      return result;
    },
    [run, mapper, base, context, onDone]
  );

  return { onSelectionChange, isPending, error, reset };
}
