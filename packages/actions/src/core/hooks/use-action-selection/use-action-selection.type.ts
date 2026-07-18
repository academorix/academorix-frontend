/**
 * @file use-action-selection.type.ts
 * @module @stackra/actions/core/hooks/use-action-selection
 * @description Selection shape + mapper type for the
 *   `useActionSelection` hook.
 */

import type { IActionDescriptor } from '@stackra/contracts';

/**
 * Selection value emitted by HeroUI's `Select` / `ListBox` /
 * `RadioGroup` / `TagGroup` — mirrors React Aria Components' shape.
 *
 * @typeParam K - Key type. Defaults to `string | number`, matching HeroUI's
 *   `Selection`.
 */
export type ActionSelection<K extends string | number = string | number> = 'all' | ReadonlySet<K>;

/**
 * Function invoked on every `onSelectionChange` event to produce the
 * descriptor to dispatch.
 *
 * @typeParam K - Selection key type.
 * @typeParam D - Descriptor variant produced.
 * @param selection - The new selection value.
 * @param base - The descriptor `useActionSelection` was bound to.
 * @returns The descriptor to dispatch — typically `base` merged with `selection`.
 */
export type ActionSelectionMapper<
  K extends string | number = string | number,
  D extends IActionDescriptor = IActionDescriptor,
> = (selection: ActionSelection<K>, base: D) => D;
