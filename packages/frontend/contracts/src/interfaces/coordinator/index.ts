/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/coordinator
 * @description Barrel export for the coordinator contract.
 */

export type { ILockManager, ILockOptions } from "./lock-manager.interface";
export type { ITabInfo } from "./tab-info.interface";
export type { ITabCoordinator, TabRoleListener } from "./tab-coordinator.interface";
export type { ITabTransport, TabTransportListener } from "./tab-transport.interface";
export type { ITabTransportManager } from "./tab-transport-manager.interface";
