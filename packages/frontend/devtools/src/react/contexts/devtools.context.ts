/**
 * @file devtools.context.ts
 * @module @stackra/devtools/react/contexts
 * @description React context that carries the resolved devtools
 *   registries + frame-state service down the tree.
 *
 *   The context is populated by `DevtoolsProvider` — consumers
 *   read it via `useDevtoolsContext()` and its higher-level
 *   companions (`useDevtoolsPanels`, `useDevtoolsFrameState`, …).
 */

import { createContext } from "react";

import type { IDevtoolsContextValue } from "./devtools-context-value.interface";

/**
 * The devtools React context — `null` by default so consumers can
 * detect the missing provider and render a helpful message.
 */
export const DevtoolsContext = createContext<IDevtoolsContextValue | null>(null);

/** Display name for React DevTools introspection. */
DevtoolsContext.displayName = "DevtoolsContext";
