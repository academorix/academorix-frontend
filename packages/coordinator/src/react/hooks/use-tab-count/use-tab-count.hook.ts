/**
 * @file use-tab-count.hook.ts
 * @module @stackra/coordinator/react
 * @description React hook that returns the number of active tabs.
 */

import { useState, useEffect } from 'react';
import { useInject } from '@stackra/container/react';
import { TAB_COORDINATOR } from '@stackra/contracts';
import { TabCoordinator } from '@/core/services/tab-coordinator.service';

/**
 * Returns the number of currently active tabs.
 *
 * Updates when tabs open or close.
 *
 * @returns Active tab count
 *
 * @example
 * ```typescript
 * function TabInfo() {
 *   const count = useTabCount();
 *   return <span>{count} tab(s) open</span>;
 * }
 * ```
 */
export function useTabCount(): number {
  const coordinator = useInject<TabCoordinator>(TAB_COORDINATOR);
  const [count, setCount] = useState(() => coordinator.getTabCount());

  useEffect(() => {
    // Poll tab count periodically (no dedicated observable in the simplified API)
    const interval = setInterval(() => {
      setCount(coordinator.getTabCount());
    }, 2000);
    return () => clearInterval(interval);
  }, [coordinator]);

  return count;
}
