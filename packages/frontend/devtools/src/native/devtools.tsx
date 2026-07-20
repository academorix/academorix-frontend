/**
 * @file devtools.tsx
 * @module @stackra/devtools/native
 * @description The one-liner mount point — `<Devtools />` — for
 *   React Native consumers.
 *
 *   Short-circuits to `null` in a single path:
 *
 *   - **Disabled** — the resolved `config.enabled === false`. This
 *     is the production-tree-shake path: bundlers that constant-
 *     fold `NODE_ENV === 'production'` will see the short-circuit
 *     and drop the shell subtree from the bundle.
 *
 *   The web `<Devtools />` also renders through a DOM portal;
 *   there's no equivalent on native, so the wrapper just returns
 *   Provider + Launcher + Shell inline. The consumer app is
 *   expected to mount `<Devtools />` at the very top of its
 *   navigation tree so the sheet + launcher float above the
 *   route stack.
 */

import { type ReactElement } from 'react';
import { useOptionalInject } from '@stackra/container/react';

import { DEFAULT_DEVTOOLS_CONFIG, DEVTOOLS_CONFIG } from '@/core/constants';
import type { IDevtoolsModuleOptions } from '@/core/interfaces';
import { mergeConfig } from '@/core/utils';

import { DevtoolsLauncher } from './components/devtools-launcher';
import { DevtoolsShell } from './components/devtools-shell';
import { DevtoolsProvider } from './providers/devtools';

/** Props for the native `<Devtools />` wrapper. */
export interface DevtoolsProps {
  /**
   * Optional override for the resolved `enabled` flag — useful
   * when a specific route in an app wants to opt-out of devtools
   * regardless of the module-level config.
   */
  readonly enabled?: boolean;
}

/**
 * Mount the native devtools shell.
 *
 * @example
 * ```tsx
 * import { Devtools } from '@stackra/devtools/native';
 *
 * export function App() {
 *   return (
 *     <>
 *       <RootNavigator />
 *       <Devtools />
 *     </>
 *   );
 * }
 * ```
 */
export function Devtools({ enabled }: DevtoolsProps = {}): ReactElement | null {
  // Config is optional at the DI layer — a caller who mounted
  // `<Devtools />` without wiring `DevtoolsModule.forRoot()` gets
  // sensible defaults.
  const rawConfig = useOptionalInject<IDevtoolsModuleOptions>(DEVTOOLS_CONFIG);
  const config = rawConfig ?? mergeConfig(DEFAULT_DEVTOOLS_CONFIG);

  // Enabled resolution — per-mount override beats the module-
  // level config; `undefined` means "no opinion, use the
  // resolved config".
  const isEnabled = enabled ?? config.enabled ?? true;
  if (!isEnabled) return null;

  return (
    <DevtoolsProvider>
      <DevtoolsLauncher />
      <DevtoolsShell />
    </DevtoolsProvider>
  );
}
