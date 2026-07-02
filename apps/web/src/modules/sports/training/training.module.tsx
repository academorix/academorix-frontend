/**
 * @file training.module.tsx
 * @module modules/sports/training
 *
 * @description
 * The Training module — coached practice sessions for a team, scoped by the
 * active branch + season. Full CRUD.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.2 "Training"
 */

import { BoltIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const TrainingListPage = lazy(() => import("@/modules/sports/training/pages/list"));
const TrainingCreatePage = lazy(() => import("@/modules/sports/training/pages/create"));
const TrainingEditPage = lazy(() => import("@/modules/sports/training/pages/edit"));
const TrainingShowPage = lazy(() => import("@/modules/sports/training/pages/show"));

/** The Training feature module. */
const trainingModule: AppModule = {
  name: "training",
  resources: [
    {
      name: "training-sessions",
      list: "/training-sessions",
      create: "/training-sessions/create",
      edit: "/training-sessions/:id/edit",
      show: "/training-sessions/:id",
      meta: {
        label: "Training",
        icon: BoltIcon,
        featureKey: "training-sessions",
        requiredPermission: "training-sessions.viewAny",
        order: 21,
        scopedBy: ["branch", "season"],
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/training-sessions", element: createElement(TrainingListPage) },
    {
      tier: "protected",
      path: "/training-sessions/create",
      element: createElement(TrainingCreatePage),
    },
    {
      tier: "protected",
      path: "/training-sessions/:id/edit",
      element: createElement(TrainingEditPage),
    },
    { tier: "protected", path: "/training-sessions/:id", element: createElement(TrainingShowPage) },
  ],
};

export default trainingModule;
