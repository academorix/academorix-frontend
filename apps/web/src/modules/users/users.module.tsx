/**
 * @file users.module.tsx
 * @module modules/users
 *
 * @description
 * The Users module — tenant staff/admin accounts (identity + status + roles).
 * Full CRUD; role assignment is surfaced via the Access module.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.5 "User"
 */

import { UsersIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const UserListPage = lazy(() => import("@/modules/users/pages/list"));
const UserCreatePage = lazy(() => import("@/modules/users/pages/create"));
const UserEditPage = lazy(() => import("@/modules/users/pages/edit"));
const UserShowPage = lazy(() => import("@/modules/users/pages/show"));

/** The Users feature module. */
const usersModule: AppModule = {
  name: "users",
  resources: [
    {
      name: "users",
      list: "/users",
      create: "/users/create",
      edit: "/users/:id/edit",
      show: "/users/:id",
      meta: {
        label: "Users",
        icon: UsersIcon,
        featureKey: "users",
        requiredPermission: "users.viewAny",
        order: 41,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/users", element: createElement(UserListPage) },
    { tier: "protected", path: "/users/create", element: createElement(UserCreatePage) },
    { tier: "protected", path: "/users/:id/edit", element: createElement(UserEditPage) },
    { tier: "protected", path: "/users/:id", element: createElement(UserShowPage) },
  ],
};

export default usersModule;
