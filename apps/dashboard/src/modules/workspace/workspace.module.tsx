/**
 * @file workspace.module.tsx
 * @module modules/workspace
 *
 * @description
 * Central-host module: workspace picker, "find my workspaces" (email me the
 * list), and self-serve workspace creation. All routes are `hosts: ["central",
 * "central-admin"]` so they never appear on tenant subdomains — where the
 * landing + auth modules take over.
 */

import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { appRoutes } from "@/lib/module/routes";

const WorkspacePickerPage = lazy(() => import("@/modules/workspace/pages/workspace-picker-page"));
const FindWorkspacesPage = lazy(() => import("@/modules/workspace/pages/find-workspaces-page"));
const CreateWorkspacePage = lazy(() => import("@/modules/workspace/pages/create-workspace-page"));

const workspaceModule: AppModule = {
  name: "workspace",
  routes: [
    {
      tier: "public",
      index: true,
      element: createElement(WorkspacePickerPage),
      hosts: ["central", "central-admin"],
    },
    {
      tier: "public",
      path: appRoutes.workspacePicker,
      element: createElement(WorkspacePickerPage),
      hosts: ["central", "central-admin"],
    },
    {
      tier: "public",
      path: appRoutes.findWorkspaces,
      element: createElement(FindWorkspacesPage),
      hosts: ["central", "central-admin"],
    },
    {
      tier: "public",
      path: appRoutes.createWorkspace,
      element: createElement(CreateWorkspacePage),
      hosts: ["central", "central-admin"],
    },
  ],
};

export default workspaceModule;
