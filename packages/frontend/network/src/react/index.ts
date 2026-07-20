/**
 * @file index.ts
 * @module @stackra/network/react
 * @description React (web) subpath for @stackra/network.
 *   Provides WebNetworkModule, BrowserNetworkDetector, useNetworkStatus hook,
 *   and web components.
 */

// ============================================================================
// Module
// ============================================================================
export { WebNetworkModule } from "./web-network.module";

// ============================================================================
// Detectors
// ============================================================================
export { BrowserNetworkDetector } from "./detectors";

// ============================================================================
// Hooks
// ============================================================================
export { useNetworkStatus } from "../core/hooks";
export type { UseNetworkStatusResult } from "../core/hooks";

// ============================================================================
// Components
// ============================================================================
export { OfflineBanner } from "./components";
export type { OfflineBannerProps } from "./components";
export { NetworkStatusIndicator } from "./components";
export type { NetworkStatusIndicatorProps } from "./components";
