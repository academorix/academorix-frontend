/**
 * @file devtools.context.ts
 * @module @stackra/devtools/native/contexts
 * @description React context that carries the resolved devtools
 *   registries + services to the native shell tree.
 *
 *   Populated by `DevtoolsProvider` (native); consumers read via
 *   `useNativeDevtoolsContext()`. Kept separate from the web
 *   context because RN mounts a different renderer + tree, so
 *   the two contexts can't share a single instance.
 */

import { createContext } from "react";

import type { IDevtoolsNativeContextValue } from "../interfaces/devtools-context-value.interface";

/**
 * The native devtools React context — `null` by default so
 * consumers can detect a missing provider and surface a helpful
 * error.
 */
export const DevtoolsContext = createContext<IDevtoolsNativeContextValue | null>(null);

/** Display name for React DevTools introspection. */
DevtoolsContext.displayName = "DevtoolsNativeContext";
