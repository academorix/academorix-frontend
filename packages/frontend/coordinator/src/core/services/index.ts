/**
 * @file index.ts
 * @module @stackra/coordinator/core/services
 * @description Barrel export for coordinator services.
 *
 *   `ILockOptions` lives in `../interfaces/` (the canonical home for
 *   types). We re-export it from there so consumers that import from
 *   the services folder still get the type without a second import.
 */

export { TabCoordinator } from './tab-coordinator.service';
export { LockManager } from './lock-manager.service';
export { CoordinatorTransport } from './coordinator-transport.service';
export { TabTransportManager } from './tab-transport-manager.service';
export type { ILockOptions } from '@/core/interfaces';
