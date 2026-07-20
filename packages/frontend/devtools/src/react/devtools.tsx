/**
 * @file devtools.tsx
 * @module @stackra/devtools/react
 * @description The one-liner mount point — `<Devtools />` — that
 *   consumers drop into their app root.
 *
 *   Short-circuits to `null` in two paths:
 *
 *   1. **SSR** — `typeof document === 'undefined'`. We must NOT
 *      render a portal on the server; the shell is a runtime dev
 *      tool.
 *   2. **Disabled** — resolved `config.enabled === false`. This is
 *      the production-tree-shake path: bundlers that constant-fold
 *      `NODE_ENV === 'production'` will see the short-circuit and
 *      drop the entire shell subtree from the bundle.
 *
 *   The component is thin on purpose — every non-null path defers
 *   to the shell + provider + launcher + inspector overlay.
 */

import { createPortal } from "react-dom";
import { type ReactElement, type ReactNode } from "react";
import { useOptionalInject } from "@stackra/container/react";

import { DEFAULT_DEVTOOLS_CONFIG, DEVTOOLS_CONFIG } from "@/core/constants";
import type { IDevtoolsModuleOptions } from "@/core/interfaces";
import { mergeConfig } from "@/core/utils";
import { DevtoolsInspectorOverlay } from "./components/devtools-inspector-overlay";
import { DevtoolsLauncher } from "./components/devtools-launcher";
import { DevtoolsShell } from "./components/devtools-shell";
import { DevtoolsProvider } from "./providers/devtools";

/** Props for {@link Devtools}. */
export interface DevtoolsProps {
  /**
   * Optional portal target. Defaults to `document.body`. Consumers
   * can pass a dedicated element when they need finer control over
   * z-index stacking (e.g. inside a shadow-DOM boundary).
   */
  readonly portalTarget?: Element | null;
  /**
   * Optional override for the resolved `enabled` flag — useful when
   * a specific route in an app wants to opt-out of devtools
   * regardless of the module-level config.
   */
  readonly enabled?: boolean;
}

/**
 * Mount the devtools shell.
 *
 * @example
 * ```tsx
 * // vite-example/src/main.tsx
 * import { Devtools } from '@stackra/devtools/react';
 *
 * <StackraRouter router={router}>
 *   <RouterOutlet />
 *   <Devtools />
 * </StackraRouter>
 * ```
 */
export function Devtools({ portalTarget, enabled }: DevtoolsProps = {}): ReactElement | null {
  // Config is optional at the DI layer — a caller who mounted
  // `<Devtools />` without wiring `DevtoolsModule.forRoot()` gets
  // sensible defaults.
  const rawConfig = useOptionalInject<IDevtoolsModuleOptions>(DEVTOOLS_CONFIG);
  const config = rawConfig ?? mergeConfig(DEFAULT_DEVTOOLS_CONFIG);

  // Enabled resolution — the caller's per-mount override beats the
  // module-level config. `undefined` means "no opinion, use the
  // resolved config".
  const isEnabled = enabled ?? config.enabled ?? true;
  if (!isEnabled) return null;

  // SSR guard — we render into `document.body`, and there's no
  // document on the server.
  if (typeof document === "undefined") return null;

  const target = portalTarget ?? document.body;
  const tree: ReactNode = (
    <DevtoolsProvider>
      <DevtoolsLauncher />
      <DevtoolsShell />
      <DevtoolsInspectorOverlay />
    </DevtoolsProvider>
  );

  return createPortal(tree, target);
}
