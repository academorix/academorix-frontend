/**
 * @file access-control.config.ts
 * @module @academorix/access-control/config
 * @description
 * Package default configuration for `@academorix/access-control`.
 * `AccessControlModule.forRoot()` deep-merges consumer overrides
 * into this default — every endpoint is present at runtime.
 */

import { defineConfig } from "../src/utilities/define-config";

export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Platform Guard Endpoints
  |--------------------------------------------------------------------------
  |
  | URL paths for the platform-scoped controllers (Academorix staff,
  | cross-tenant admin). Match the routes registered by
  | `AccessServiceProvider` on the platform surface.
  |
  */

  platformEndpoints: {
    // Ability check endpoints
    can: "/api/v1/platform/access/abilities/check",
    mine: "/api/v1/platform/access/abilities/mine",

    // Permission CRUD
    permissions: "/api/v1/platform/access/permissions",

    // Role CRUD
    roles: "/api/v1/platform/access/roles",

    // Role-permission sync (POST to `/roles/{id}/permissions`)
    rolePermissions: (roleId: string) =>
      `/api/v1/platform/access/roles/${encodeURIComponent(roleId)}/permissions`,

    // User-role assignment (POST /users/{userId}/roles, DELETE /{roleId})
    userRoles: (userId: string) =>
      `/api/v1/platform/access/users/${encodeURIComponent(userId)}/roles`,
    userRole: (userId: string, roleId: string) =>
      `/api/v1/platform/access/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`,
  },

  /*
  |--------------------------------------------------------------------------
  | Tenant Guard Endpoints
  |--------------------------------------------------------------------------
  |
  | URL paths for the tenant-scoped controllers (the customer's own
  | admins + users). Same shape as the platform endpoints, different
  | prefix.
  |
  */

  tenantEndpoints: {
    can: "/api/v1/access/abilities/check",
    mine: "/api/v1/access/abilities/mine",
    permissions: "/api/v1/access/permissions",
    roles: "/api/v1/access/roles",
    rolePermissions: (roleId: string) =>
      `/api/v1/access/roles/${encodeURIComponent(roleId)}/permissions`,
    userRoles: (userId: string) => `/api/v1/access/users/${encodeURIComponent(userId)}/roles`,
    userRole: (userId: string, roleId: string) =>
      `/api/v1/access/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`,
  },

  /*
  |--------------------------------------------------------------------------
  | Boot-Payload Endpoint
  |--------------------------------------------------------------------------
  |
  | Path returning the current user's permissions + roles + abilities.
  | `<AccessControlProvider source={{kind: 'fetch-on-mount'}}>` hits
  | this URL; boot payloads pre-populate the same shape via SSR.
  |
  */

  meEndpoint: "/api/v1/me",
});
