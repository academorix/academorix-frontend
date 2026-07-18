/**
 * @file leader-key-bridge.tsx
 * @module components/leader-key-bridge
 *
 * @description
 * A zero-DOM component that mounts `useLeaderKey()`. Kept separate so App.tsx
 * doesn't need to call the hook itself, and so nested routes can override the
 * behaviour by unmounting the bridge if ever needed.
 */

import { useLeaderKey } from "@/hooks/use-leader-key";

export function LeaderKeyBridge(): null {
  useLeaderKey();

  return null;
}
