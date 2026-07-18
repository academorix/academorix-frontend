/**
 * @file index.ts
 * @module @stackra/consent/react
 * @description Web platform entry point for the consent module.
 *
 *   Provides:
 *   - `WebConsentModule.forRoot()` — backward-compatible alias of
 *     `ConsentModule.forRoot()`. Storage persistence is now unified
 *     through `@stackra/storage` — set `storageInstance` on the
 *     consent config and import `WebStorageModule` upstream.
 *   - `useConsent` / `useConsentGate` / `useConsentBanner` — React hooks
 *   - `<ConsentBanner>` — HeroUI-based consent banner
 *   - Re-exports everything from core (module, services, types, tokens)
 */

// Module (backward-compat alias — new code imports ConsentModule from core)
export { WebConsentModule } from './web-consent.module';

// Hooks + result types
export { useConsent, type UseConsentResult } from './hooks';
export { useConsentGate, type UseConsentGateResult } from './hooks';
export { useConsentBanner, type UseConsentBannerResult } from './hooks';

// Components
export { ConsentBanner } from './components';
export type { ConsentBannerProps } from './components';

// Re-exports from core (module, services, types, tokens)
export * from '../core';
