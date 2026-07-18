/**
 * @file use-branch-switcher.ts
 * @module hooks/use-branch-switcher
 *
 * @description
 * Central hook for changing the active branch scope. Handles four things
 * every caller cares about:
 *
 *  1. Mutating the client-side identity snapshot (see `identity-store.ts`).
 *  2. Invalidating Refine's auth store so `useGetIdentity()` refetches
 *     with the new active branch label.
 *  3. Invalidating every scoped data query so lists / KPIs / show pages
 *     refresh under the new branch without a full-page reload.
 *  4. Toasting the change so the switch feels acknowledged.
 *
 * When the backend endpoint lands (`POST /api/me/active-branch`), swap
 * step 1 for the real mutation and keep the rest.
 */

import { useInvalidate, useInvalidateAuthStore, useNotification } from "@refinedev/core";
import { useCallback } from "react";

import { setActiveBranch } from "@/refine/identity-store";

export type BranchSwitchResult = {
  ok: boolean;
  branchName?: string;
};

export function useBranchSwitcher() {
  const invalidateAuth = useInvalidateAuthStore();
  const invalidate = useInvalidate();
  const { open: notify } = useNotification();

  return useCallback(
    (branchId: string): BranchSwitchResult => {
      const branch = setActiveBranch(branchId);

      if (!branch) {
        return { ok: false };
      }

      // 1. Refetch identity — navbar, sidebar, and scope pill will re-render
      //    with the new active branch label.
      void invalidateAuth();

      // 2. Nuke every scoped data query. `invalidate({resource, invalidates:
      //    ["all"]})` without a resource name broadcasts to every registered
      //    resource, which is exactly what we want on a scope change.
      void invalidate({ invalidates: ["all"] });

      notify?.({
        key: `branch-switch-${branch.id}`,
        message: `Switched to ${branch.name}`,
        description: branch.city ? `Now viewing ${branch.city}.` : undefined,
        type: "success",
      });

      return { ok: true, branchName: branch.name };
    },
    [invalidateAuth, invalidate, notify],
  );
}
