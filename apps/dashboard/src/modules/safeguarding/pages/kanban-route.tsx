/**
 * @file kanban-route.tsx
 * @module modules/safeguarding/pages/kanban-route
 *
 * @description
 * Tiny route wrapper for the safeguarding Kanban view. Reads
 * `features.kanbanViews` at render time (not at manifest load time) so the
 * check is a React branch, and the manifest itself stays a plain data
 * structure. When the flag is off we redirect to the list; when it's on we
 * render the actual kanban page.
 */

import { lazy } from "react";
import { Navigate } from "@stackra/routing/react";

import type { ReactNode } from "react";

import { features } from "@/config/features.config";

const SafeguardingKanbanPage = lazy(() => import("@/modules/safeguarding/pages/kanban"));

/**
 * Renders the safeguarding kanban when the feature flag is on, otherwise
 * redirects to the list. Uses `replace` so the disabled URL never lands in
 * the browser history.
 */
export default function SafeguardingKanbanRoute(): ReactNode {
  if (!features.kanbanViews) {
    return <Navigate replace to="/safeguarding" />;
  }

  return <SafeguardingKanbanPage />;
}
