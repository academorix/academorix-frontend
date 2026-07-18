/**
 * @file use-devtools-context.hook.ts
 * @module @stackra/devtools/react/hooks
 * @description Read the resolved {@link IDevtoolsContextValue} from
 *   the surrounding `DevtoolsProvider`.
 *
 *   Throws with a helpful message when the caller is outside the
 *   provider — this is a developer bug, not a runtime state.
 */

import { useContext } from 'react';

import { DevtoolsContext } from '../contexts/devtools.context';
import type { IDevtoolsContextValue } from '../contexts/devtools-context-value.interface';

/**
 * Read the current devtools context.
 *
 * @throws Error when the caller is not wrapped in a
 *   `DevtoolsProvider`.
 */
export function useDevtoolsContext(): IDevtoolsContextValue {
  const value = useContext(DevtoolsContext);
  if (!value) {
    throw new Error(
      '[@stackra/devtools] useDevtoolsContext must be used inside <DevtoolsProvider>.'
    );
  }
  return value;
}
