/**
 * @file index.ts
 * @module @stackra/pwa/core/interfaces
 * @description Barrel export for core PWA interfaces.
 */

export type { IPwaModuleOptions } from "./pwa-module-options.interface";
export type { IPwaInstallState } from "./pwa-install-state.interface";
export type { IPwaUpdateState } from "./pwa-update-state.interface";
export type { IPwaSnapshot } from "./pwa-snapshot.interface";
export type { IPwaAttribution, IPwaUtmParams, PwaDisplayMode } from "./pwa-attribution.interface";
export type { IPwaInstallConfig } from "./install-config.interface";
export type { IPwaUpdateConfig } from "./update-config.interface";
export type { IAppUpdateConfig, IAppUpdateEndpoints } from "./app-update-config.interface";
export type { IAppUpdateManifest } from "./app-update-manifest.interface";
export type { IAppUpdateState } from "./app-update-state.interface";
