/**
 * @file use-is-leader.hook.ts
 * @module @stackra/coordinator/react
 * @description React hook that returns whether the current tab is the leader.
 */

import { useState, useEffect } from "react";
import { useInject } from "@stackra/container/react";
import { TAB_COORDINATOR } from "@stackra/contracts";
import { TabCoordinator } from "@/core/services/tab-coordinator.service";

/**
 * Returns whether this tab is the elected leader.
 *
 * Re-renders when leadership changes.
 *
 * @returns `true` if this tab is the leader
 *
 * @example
 * ```typescript
 * function SyncIndicator() {
 *   const isLeader = useIsLeader();
 *   return isLeader ? <Badge>Syncing</Badge> : null;
 * }
 * ```
 */
export function useIsLeader(): boolean {
  const coordinator = useInject<TabCoordinator>(TAB_COORDINATOR);
  const [isLeader, setIsLeader] = useState(() => coordinator.isLeader());

  useEffect(() => {
    const unsubscribe = coordinator.onRoleChange((role) => {
      setIsLeader(role === "leader");
    });
    return unsubscribe;
  }, [coordinator]);

  return isLeader;
}
