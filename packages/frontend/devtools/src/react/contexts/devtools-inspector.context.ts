/**
 * @file devtools-inspector.context.ts
 * @module @stackra/devtools/react/contexts
 * @description React context that carries the inspector overlay's
 *   local state — enabled flag + `setEnabled` toggle.
 *
 *   The panels registry + inspector registry live on the outer
 *   {@link DevtoolsContext}; this inner context exists so the
 *   inspector overlay + toolbar can toggle in isolation without
 *   causing the whole shell to re-render.
 */

import { createContext } from "react";

import type { IDevtoolsInspectorContextValue } from "./devtools-inspector-context-value.interface";

/**
 * Inspector-scope React context — `null` by default when the
 * inspector isn't mounted.
 */
export const DevtoolsInspectorContext = createContext<IDevtoolsInspectorContextValue | null>(null);

/** Display name for React DevTools introspection. */
DevtoolsInspectorContext.displayName = "DevtoolsInspectorContext";
