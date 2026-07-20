/**
 * @file ai.provider.tsx
 * @module @stackra/ai/react
 * @description `<AiProvider>` — mounts the AI-package side effects that
 *   need to sit inside the DI-container React context: currently, the
 *   multi-tab leader gate that wires `@stackra/coordinator` into
 *   `ContextCollector.setLeader`.
 *
 *   This provider does **not** wrap `ContainerProvider`. The app is
 *   expected to mount `ContainerProvider` (or its SSR-friendly
 *   equivalent) once at the root — `AiProvider` sits inside that tree
 *   and adds only the AI-specific wiring. Rendering it more than once
 *   is safe (the effect is idempotent) but unnecessary.
 *
 *   When `@stackra/coordinator` is absent (single-tab / headless / SSR
 *   consumers), the internal `LeaderGate` is a no-op and the collector's
 *   default `leader = true` is left in place (Design Decision 6).
 *
 * @example
 * ```tsx
 * // main.tsx
 * import 'reflect-metadata';
 * import { ApplicationFactory } from '@stackra/container';
 * import { ContainerProvider } from '@stackra/container/react';
 * import { AiProvider, AiChat } from '@stackra/ai/react';
 *
 * const app = await ApplicationFactory.create(AppModule);
 *
 * root.render(
 *   <ContainerProvider context={app}>
 *     <AiProvider>
 *       <AiChat persona="analyst" />
 *     </AiProvider>
 *   </ContainerProvider>
 * );
 * ```
 */

import type { JSX, ReactNode } from "react";
import { Fragment } from "react";

import { LeaderGate } from "./leader-gate.component";

/** Props accepted by {@link AiProvider}. */
export interface IAiProviderProps {
  /** Children of the provider. */
  children: ReactNode;
}

/**
 * Mounts the AI-package's in-tree side effects.
 *
 * Assumes an ancestor has already mounted the `ContainerProvider` from
 * `@stackra/container/react` (typically at the app root, so SSR and
 * routing share the same container).
 */
export function AiProvider(props: IAiProviderProps): JSX.Element {
  return (
    <Fragment>
      <LeaderGate />
      {props.children}
    </Fragment>
  );
}
