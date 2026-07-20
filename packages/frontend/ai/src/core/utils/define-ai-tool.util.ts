/**
 * @file define-ai-tool.util.ts
 * @module @stackra/ai/core/utils
 * @description `defineAiTool(definition)` — typed identity for authoring
 *   a client-tool definition outside its host component.
 *
 *   Purely a DX helper (like `defineConfig`). Does NOT perform runtime
 *   registration — that's the job of `useAiTool` / `createAiTool`, per
 *   Requirement 6.14 (no decorator, no DI discovery path for client tools).
 *
 * @example Static definition + inline registration:
 * ```typescript
 * import { z } from 'zod';
 * import { defineAiTool, useAiTool } from '@stackra/ai/react';
 *
 * const navigateTool = defineAiTool({
 *   name: 'navigate',
 *   description: 'Navigate the UI',
 *   parameters: z.object({ url: z.string() }),
 *   handler: async ({ url }) => {
 *     history.push(url as string);
 *     return { ok: true };
 *   },
 * });
 *
 * function OrdersView() {
 *   useAiTool(navigateTool);
 *   return <List />;
 * }
 * ```
 *
 * @example Definition-first, handler-at-call-site:
 * ```typescript
 * import { createAiTool } from '@stackra/ai/react';
 *
 * const useNavigateTool = createAiTool(defineAiTool({
 *   name: 'navigate',
 *   description: 'Navigate the UI',
 *   parameters: z.object({ url: z.string() }),
 * }));
 *
 * function OrdersView() {
 *   const navigate = useNavigate();
 *   useNavigateTool(async ({ url }) => {
 *     navigate(url as string);
 *     return { ok: true };
 *   });
 *   return <List />;
 * }
 * ```
 */

import type { IAiClientToolDefinition } from "@stackra/contracts";

import type { ToolHandler } from "@/core/registries/tool.registry";

/**
 * A client-tool definition — the shape passed to `useAiTool`.
 *
 * The `handler` is optional in this authoring-time shape so definitions
 * can be shared between the `createAiTool` factory (which accepts the
 * handler at the returned hook's call site) and inline `useAiTool` usage
 * (which requires the handler).
 */
export interface IAiToolDefinition extends IAiClientToolDefinition {
  /**
   * Executable handler. Optional at authoring time — required when the
   * definition is passed to `useAiTool` directly.
   */
  handler?: ToolHandler;
}

/**
 * Typed identity for a client-tool definition.
 *
 * Preserves the caller's parameter-schema generic so `handler(args)`
 * receives the inferred type from the zod schema (or JSON-schema literal).
 *
 * @param definition - The client-tool definition.
 * @returns The same definition object, fully typed.
 */
export function defineAiTool<T extends IAiToolDefinition>(definition: T): T {
  return definition;
}
