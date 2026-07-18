/**
 * @file index.ts
 * @module @academorix/access-control/hooks
 * @description Barrel for the hot-path readers + admin CRUD hooks.
 */

// Hot-path readers (no HTTP)
export * from "./use-access-control-context";
export * from "./use-has-permission";
export * from "./use-has-any-permission";
export * from "./use-has-all-permissions";
export * from "./use-has-role";
export * from "./use-has-any-role";

// Server-side ability check (React Query)
export * from "./use-can";

// Admin CRUD — queries
export * from "./use-permissions";
export * from "./use-permission";
export * from "./use-roles";
export * from "./use-role";

// Admin CRUD — mutations
export * from "./use-create-permission";
export * from "./use-update-permission";
export * from "./use-create-role";
export * from "./use-update-role";
export * from "./use-delete-role";
export * from "./use-sync-role-permissions";
export * from "./use-assign-role";
export * from "./use-revoke-role";
