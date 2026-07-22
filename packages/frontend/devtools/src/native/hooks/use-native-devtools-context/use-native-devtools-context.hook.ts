/**
 * @file use-native-devtools-context.hook.ts
 * @module @stackra/devtools/native/hooks
 * @description Read the resolved {@link IDevtoolsNativeContextValue}
 *   from the surrounding native `DevtoolsProvider`.
 *
 *   Throws with a helpful message when the caller is outside the
 *   provider — this is a developer bug, not a runtime state.
 */

import { useContext } from "react";

import { DevtoolsContext } from "../../contexts/devtools";
import type { IDevtoolsNativeContextValue } from "../../interfaces/devtools-context-value.interface";

/**
 * Read the current native devtools context.
 *
 * @throws Error when the caller is not wrapped in a
 *   native `DevtoolsProvider`.
 */
export function useNativeDevtoolsContext(): IDevtoolsNativeContextValue {
  const value = useContext(DevtoolsContext);
  if (!value) {
    throw new Error(
      "[@stackra/devtools] useNativeDevtoolsContext must be used inside <DevtoolsProvider> from @stackra/devtools/native.",
    );
  }
  return value;
}
