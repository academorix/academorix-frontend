/**
 * @file use-ai-route-context.hook.ts
 * @module @stackra/routing/react/hooks/use-ai-route-context
 * @description Read the AI route-context frame published by the AI
 *   integration (opt-in per PLAN v3.8).
 *
 *   Returns `null` when AI integration is disabled. F.2 ships the
 *   stub; the real integration lands in phase G.
 *
 * TODO(G): wire to `@stackra/ai`'s context registry when the AI
 *   package lands.
 */

import { useContainer } from "@stackra/container/react";

import { AiRouteContextService } from "@/core/services/ai-route-context.service";

/**
 * Read the current AI route-context frame.
 *
 * @returns Context frame — `null` when AI integration is disabled.
 *
 * @example
 * ```typescript
 * const ctx = useAiRouteContext();
 * if (ctx) prompt.append(ctx);
 * ```
 */
export function useAiRouteContext(): unknown {
  const container = useContainer();
  // The AI service is only registered when `RoutingModule.forRoot({ai: true})`
  // — resolve defensively so this hook is safe to call whether AI
  // is on or off.
  let service: AiRouteContextService | undefined;
  try {
    service = container.get(AiRouteContextService);
  } catch {
    // fail-soft — AI wasn't wired.
  }
  if (!service || !service.isEnabled()) return null;
  return service.getCurrentContext();
}
