/**
 * @file create-ai-tool.factory.ts
 * @module @stackra/ai/core/hooks
 * @description `createAiTool(definition)` returns a typed React hook that
 *   registers a client tool while the caller is mounted and unregisters
 *   on unmount. The returned hook may accept the handler at the call
 *   site so the definition is authored once and the live handler binds
 *   where component state is available (Req 6.2, 6.6).
 *
 *   The `ref` indirection lets the handler close over live state
 *   without re-registering the tool on every render.
 */

import { useEffect, useRef } from "react";
import { useInject } from "@stackra/container/react";
import { AI_TOOL_REGISTRY } from "@stackra/contracts";

import { ToolRegistry, type ToolHandler } from "@/core/registries/tool.registry";
import type { IAiToolDefinition } from "@/core/utils/define-ai-tool.util";

/**
 * A tool definition that carries its handler inline — the shape
 * `useAiTool(...)` (the inline authoring form) accepts.
 */
export interface IAiToolDefinitionWithHandler extends IAiToolDefinition {
  handler: ToolHandler;
}

/**
 * A tool hook returned by `createAiTool` — bind a live handler at the
 * call site to close over component state.
 */
export type AiToolHook = (handler?: ToolHandler) => void;

/**
 * Build a typed React hook for registering the given client tool.
 *
 * The returned hook can be called anywhere React allows hooks (inside a
 * component or another hook). It registers the tool while the caller is
 * mounted and unregisters on unmount, keying the registration by
 * `(name, scope)` so multiple scopes coexist.
 *
 * @param definition - The client-tool definition. `handler` may be
 *   omitted here and supplied at the returned hook's call site.
 * @returns A React hook that registers the tool.
 *
 * @example
 * ```tsx
 * const useNavigateTool = createAiTool(defineAiTool({
 *   name: 'navigate',
 *   description: 'Navigate the UI',
 *   parameters: z.object({ url: z.string() }),
 * }));
 *
 * function OrdersView() {
 *   const [selection, setSelection] = useState<string | null>(null);
 *   useNavigateTool(async ({ url }) => {
 *     history.push(url as string);
 *     setSelection(null);
 *     return { ok: true };
 *   });
 *   return <ChatSurface />;
 * }
 * ```
 */
export function createAiTool(definition: IAiToolDefinition): AiToolHook {
  return function useAiToolHook(handler?: ToolHandler): void {
    const registry = useInject<ToolRegistry>(AI_TOOL_REGISTRY);
    const boundHandler = handler ?? definition.handler;
    if (!boundHandler) {
      throw new Error(
        `[createAiTool] tool "${definition.name}" needs a handler — pass it to createAiTool, defineAiTool, or the returned hook`,
      );
    }
    // The ref indirection lets the handler close over live state without
    // triggering a re-register on every render.
    const handlerRef = useRef<ToolHandler>(boundHandler);
    handlerRef.current = boundHandler;

    useEffect(() => {
      registry.register({
        definition: {
          name: definition.name,
          description: definition.description,
          parameters: definition.parameters,
          ...(definition.requiresApproval !== undefined
            ? { requiresApproval: definition.requiresApproval }
            : {}),
          ...(definition.priority !== undefined ? { priority: definition.priority } : {}),
          ...(definition.scope !== undefined ? { scope: definition.scope } : {}),
        },
        handler: (args, ctx) => handlerRef.current(args, ctx),
      });
      return () => registry.unregister(definition.name, definition.scope);
      // Effect deps track name/scope only — the handler is captured via
      // ref so changing it does not re-register the tool.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registry, definition.name, definition.scope]);
  };
}
