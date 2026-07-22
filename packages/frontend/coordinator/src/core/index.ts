/**
 * @file index.ts
 * @module @stackra/coordinator
 * @description Cross-tab coordination primitives — leader election,
 *   distributed locks, and event relay across browser tabs.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { CoordinatorModule } from "./coordinator.module";

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { TabCoordinator } from "./services";
export { LockManager } from "./services";
export { CoordinatorTransport } from "./services";
export { TabTransportManager } from "./services";

// ════════════════════════════════════════════════════════════════════════════════
// Transports
// ════════════════════════════════════════════════════════════════════════════════
export { BroadcastChannelTabTransport, NoopTabTransport } from "./transports";

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { InjectCoordinator } from "./decorators";
export { InjectLockManager } from "./decorators";

// ════════════════════════════════════════════════════════════════════════════════
// Enums
// ════════════════════════════════════════════════════════════════════════════════
export { CoordinatorMessageKind } from "./enums";
export { TabRoleEnum } from "./enums";

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export { CoordinatorError } from "./errors";

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
// TAB_LOCK_MANAGER is re-exported here for backwards compatibility with the
// pre-`contract-reexports.md` public surface — new consumers should import
// it directly from `@stackra/contracts`. See the retrofit note in
// `.kiro/steering/contract-reexports.md`.
export { TAB_LOCK_MANAGER } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════
export type { TabRole } from "./types";
export type { CoordinatorMessage } from "./types";
export type { RoleListener } from "./types";
export type { ILockOptions } from "./interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type { ITabInfo } from "./interfaces";
export type { ICoordinatorModuleOptions } from "./interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig } from "./utils";
