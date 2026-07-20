/**
 * @file use-ai-tool.hook.ts
 * @module @stackra/ai/core/hooks
 * @description `useAiTool(definition)` — the inline authoring form of
 *   the tool-registration primitive.
 *
 *   Equivalent to `createAiTool(definition)()` (Req 6.3) — the returned
 *   hook is invoked immediately with the definition's own handler.
 */

import { createAiTool, type IAiToolDefinitionWithHandler } from "./create-ai-tool.factory";

/**
 * Register a client tool while the calling component is mounted.
 *
 * @param definition - The full client-tool definition (with `handler`).
 *
 * @example
 * ```tsx
 * function OrdersView() {
 *   const [orders, setOrders] = useState<Order[]>([]);
 *
 *   useAiTool({
 *     name: 'refreshOrders',
 *     description: 'Reload the orders list',
 *     parameters: z.object({}),
 *     handler: async () => {
 *       setOrders(await api.fetchOrders());
 *       return { count: orders.length };
 *     },
 *   });
 *
 *   return <List orders={orders} />;
 * }
 * ```
 */
export function useAiTool(definition: IAiToolDefinitionWithHandler): void {
  const hook = createAiTool(definition);
  hook(definition.handler);
}
