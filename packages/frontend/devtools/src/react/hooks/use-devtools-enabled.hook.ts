/**
 * @file use-devtools-enabled.hook.ts
 * @module @stackra/devtools/react/hooks
 * @description Resolve the effective `enabled` flag for the
 *   surrounding provider.
 *
 *   The resolved config already has `enabled` merged in via
 *   `mergeConfig`, so this hook is a simple accessor — its job is
 *   to be the single symbol every guard reads from, so we don't
 *   scatter `config.enabled` checks across the codebase.
 */

import { useDevtoolsContext } from "./use-devtools-context.hook";

/**
 * @returns `true` when the shell should mount, `false` otherwise.
 */
export function useDevtoolsEnabled(): boolean {
  const { config } = useDevtoolsContext();
  // `config.enabled` is defined post-`mergeConfig` — the fallback
  // is `true` in case a future config path forgets the merge step
  // (defensive; not expected under normal use).
  return config.enabled ?? true;
}
