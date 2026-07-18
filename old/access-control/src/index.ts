/**
 * @file index.ts
 * @module @academorix/access-control
 *
 * @description
 * Public API barrel. Ships types, enums, Zod schemas, DI services,
 * boot-payload provider + context, hot-path hooks, admin CRUD
 * hooks, `<CanAccess>` + `<Protected>` components, and typed
 * errors for the backend authorization middleware.
 */

// Types (wire-visible DTOs)
export * from "@academorix/contracts";

// Enums
export * from "@academorix/contracts";

// Schemas (Zod)
export * from "./schemas";

// Services (interfaces + tokens; concrete class is a wiring detail)
export * from "./services/access-control";

// Errors + HTTP interceptor
export * from "./errors";

// Module
export { AccessControlModule } from "./access-control.module";
export {
  ACCESS_CONTROL_OPTIONS_TOKEN,
  type IAccessControlConfig,
  type IAccessControlModuleOptions,
  type IAccessControlEndpoints,
} from "@academorix/contracts";

// Provider + context
export * from "./providers/access-control";
export * from "./contexts/access-control";

// Hooks
export * from "./hooks";

// Components
export * from "./components";

// Utilities (defineConfig, mergeAccessControlConfig)
export * from "./utilities";
