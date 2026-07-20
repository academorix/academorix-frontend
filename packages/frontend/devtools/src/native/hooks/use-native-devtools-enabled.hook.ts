/**
 * @file use-native-devtools-enabled.hook.ts
 * @module @stackra/devtools/native/hooks
 * @description Resolve the effective `enabled` flag for the
 *   surrounding native provider — mirrors the web hook so the
 *   `<Devtools />` wrapper can short-circuit to `null` in
 *   production and skip mounting the sheet + launcher.
 */

import { useNativeDevtoolsContext } from "./use-native-devtools-context.hook";

/**
 * @returns `true` when the native shell should mount, `false`
 *   otherwise.
 */
export function useNativeDevtoolsEnabled(): boolean {
  const { config } = useNativeDevtoolsContext();
  // `config.enabled` is defined post-`mergeConfig` — the fallback
  // is `true` in case a future config path forgets the merge
  // step (defensive; not expected under normal use).
  return config.enabled ?? true;
}
