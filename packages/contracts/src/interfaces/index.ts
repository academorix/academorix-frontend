/**
 * @file index.ts
 * @module @stackra/contracts/interfaces
 * @description Barrel export for every interface shipped by contracts.
 *   Type aliases and enums live in ../types and ../enums respectively.
 */

// DI foundation shapes
export type { Type } from "./type.interface";
export type { Abstract } from "./abstract.interface";
export type { ScopeOptions } from "./scope-options.interface";
export * from "./modules";
export * from "./hooks";

// Domain-specific
export * from "./actions";
export * from "./ai";
export * from "./analytics";
export * from "./auth";
export * from "./cache";
export * from "./console";
export * from "./config";
export * from "./consent";
export * from "./container";
export * from "./coordinator";
export * from "./csp";
export * from "./devtools";
export * from "./discovery";
export * from "./events";
export * from "./http";
export * from "./i18n";
export * from "./logger";
export * from "./monitoring";
export * from "./network";
export * from "./pipeline";
export * from "./publishing";
export * from "./pwa";
export * from "./query";
export * from "./queue";
export * from "./realtime";
export * from "./routing";
export * from "./scope";
export * from "./sdui";
export * from "./settings";
export * from "./ui";
export * from "./state";
export * from "./storage";
export * from "./sync";
export * from "./theming";
