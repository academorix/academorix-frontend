/**
 * @file index.ts
 * @module @stackra/support/managers
 * @description Base manager classes for driver-based service resolution.
 *
 *   - `Manager` — single default driver (Logger, Auth, Broadcast)
 *   - `MultipleInstanceManager` — named connections (Cache, Queue, Redis, DB)
 */

export { Manager, type DriverCreator } from "./manager";
export { MultipleInstanceManager, type InstanceCreator } from "./multiple-instance-manager";
