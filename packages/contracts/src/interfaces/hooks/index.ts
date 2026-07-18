/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/hooks
 * @description Lifecycle hook contracts for @stackra/container.
 */

export type { OnModuleInit } from "./on-init.interface";
export type { OnModuleDestroy } from "./on-destroy.interface";
export type { OnApplicationBootstrap } from "./on-application-bootstrap.interface";
export type { OnApplicationShutdown } from "./on-application-shutdown.interface";
export type { BeforeApplicationShutdown } from "./before-application-shutdown.interface";
