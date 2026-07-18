/**
 * @file ai-route-context.component.tsx
 * @module @stackra/routing/react/components/ai-route-context
 * @description Register the current match chain as an AI context
 *   frame (opt-in per PLAN v3.8).
 *
 *   No-ops when `RoutingModule.forRoot({ai: false})` — the flag
 *   is checked via `AiRouteContextService.isEnabled()`. The full
 *   integration lands in phase G with `@stackra/ai`.
 *
 *   Logic-only component per `ui-components.md`.
 *
 * TODO(G): wire to `@stackra/ai`'s context registry when the AI
 *   package is available. Today the component only touches the
 *   stub service.
 */

import { useEffect, type ReactElement } from "react";
import { useContainer } from "@stackra/container/react";
import { useMatches } from "react-router";

import { AiRouteContextService } from "@/core/services/ai-route-context.service";

/**
 * Register the current match chain with the AI context registry.
 *
 * Renders nothing. Mount once at the routing root — the framework
 * does this automatically when `RoutingModule.forRoot({ai: true})`.
 *
 * @returns Empty fragment.
 */
export function AiRouteContext(): ReactElement | null {
  const container = useContainer();
  const matches = useMatches();

  useEffect(() => {
    let service: AiRouteContextService | undefined;
    try {
      service = container.get(AiRouteContextService);
    } catch {
      // fail-soft — AI wire missing.
    }
    if (!service || !service.isEnabled()) return;

    // TODO(G): call the AI context service to publish the frame.
    // F.2 stubs the service — the call is a no-op until phase G.
    void matches;
  }, [container, matches]);

  return null;
}
