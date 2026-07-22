/**
 * @file leader-gate.component.tsx
 * @module @stackra/ai/react/providers
 * @description `LeaderGate` — a side-effect-only React component that
 *   wires multi-tab leader state from `@stackra/coordinator`'s optional
 *   `TabCoordinator` into `ContextCollector.setLeader`.
 *
 *   Renders nothing. When the coordinator is not bound (single-tab
 *   consumers, headless apps), the effect is a no-op and the collector's
 *   default `leader = true` is left in place, matching the single-tab
 *   assumption from Design Decision 6.
 */

import { useEffect } from "react";
import { useInject, useOptionalInject } from "@stackra/container/react";
import { AI_CONTEXT_COLLECTOR, TAB_COORDINATOR, type ITabCoordinator } from "@stackra/contracts";

import { ContextCollector } from "@/core/services/context-collector.service";

/**
 * Wires `TabCoordinator.onRoleChange` into `ContextCollector.setLeader`.
 *
 * Must be mounted inside a `ContainerProvider` (typically at the app
 * root). Rendered by `<AiProvider>`; consumers rarely mount this
 * component directly.
 */
export function LeaderGate(): null {
  const collector = useInject<ContextCollector>(AI_CONTEXT_COLLECTOR);
  const coordinator = useOptionalInject<ITabCoordinator>(TAB_COORDINATOR);

  useEffect(() => {
    if (!coordinator) return;
    collector.setLeader(coordinator.isLeader());
    // TabRole is a string-union enum with 'leader' / 'follower' values —
    // the tuple listener signature is compatible with the single-arg
    // callback here (extra `previous` param is ignored).
    return coordinator.onRoleChange((role) => {
      collector.setLeader(role === "leader");
    });
  }, [collector, coordinator]);

  return null;
}
