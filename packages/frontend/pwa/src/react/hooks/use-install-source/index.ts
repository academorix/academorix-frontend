/**
 * @file index.ts
 * @module @stackra/pwa/react/hooks/use-install-source
 * @description Entity barrel — re-exports the `useInstallSource` hook that
 *   reads the caller's PWA install attribution (source + medium +
 *   campaign) and its `IPwaAttribution` shape.
 */

export { useInstallSource } from "./use-install-source.hook";
export type { IPwaAttribution } from "./use-install-source.interface";
