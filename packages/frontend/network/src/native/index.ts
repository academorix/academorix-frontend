/**
 * @file index.ts
 * @module @stackra/network/native
 * @description React Native subpath for `@stackra/network`.
 *   Provides `NativeNetworkModule`, `NativeNetworkDetector`, and
 *   convenience re-exports from core.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { NativeNetworkModule } from "./native-network.module";

// ════════════════════════════════════════════════════════════════════════════════
// Detectors
// ════════════════════════════════════════════════════════════════════════════════
export { NativeNetworkDetector } from "./detectors";

// ════════════════════════════════════════════════════════════════════════════════
// Re-exports from core (convenience)
// ════════════════════════════════════════════════════════════════════════════════
export { useNetworkStatus } from "../core/hooks";
export { NetworkService } from "../core/services";

// ════════════════════════════════════════════════════════════════════════════════
// Types (package-owned only — contracts come from @stackra/contracts)
// ════════════════════════════════════════════════════════════════════════════════
export type { UseNetworkStatusResult } from "../core/hooks";
