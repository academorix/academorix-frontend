/**
 * @file index.ts
 * @module @stackra/network/interfaces
 * @description Barrel for package-owned interfaces. Cross-package contracts
 *   (`INetworkDetector`, `INetworkStatus`, …) are imported directly from
 *   `@stackra/contracts` — this package never re-exports them.
 */

export * from "./network-module-options.interface";
export * from "./use-network-status-result.interface";
