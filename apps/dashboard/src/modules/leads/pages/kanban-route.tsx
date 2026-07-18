/**
 * @file kanban-route.tsx
 * @module modules/leads/pages/kanban-route
 *
 * @description
 * Tiny route wrapper for the leads Kanban view. Reads `features.kanbanViews`
 * at *render time* (not at module manifest load time) so the check is a
 * cheap React branch instead of a top-level import in the manifest. When the
 * flag is off, we redirect to the list; when it's on, we render the actual
 * kanban page.
 *
 * Keeping the feature check here (rather than in `leads.module.tsx`) means the
 * module manifest stays a plain data structure — no imports from
 * `@/config/features.config` at manifest load time. That preserves the
 * module registry's ability to be aggressively tree-shaken and simplifies
 * test setups that mock the features registry.
 */

import { lazy } from "react";
import { Navigate } from "@stackra/routing/react";

import type { ReactNode } from "react";

import { features } from "@/config/features.config";

const LeadsKanbanPage = lazy(() => import("@/modules/leads/pages/kanban"));

/**
 * Renders the Kanban page when the feature flag is on, otherwise redirects
 * to the leads list. The redirect uses `replace` so the disabled URL never
 * lands in the browser history.
 */
export default function LeadsKanbanRoute(): ReactNode {
  if (!features.kanbanViews) {
    return <Navigate replace to="/leads" />;
  }

  return <LeadsKanbanPage />;
}
