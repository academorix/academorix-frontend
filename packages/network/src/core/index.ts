/**
 * @file index.ts
 * @module @stackra/network
 * @description Platform-agnostic network detection and monitoring.
 *   Core entry point — `NetworkModule`, `NetworkService`, and the Node.js
 *   detector. Browser detector lives in `./react`, native in `./native`.
 *
 *   Cross-package contracts (tokens `NETWORK_SERVICE`/`NETWORK_DETECTOR`,
 *   interfaces `INetworkDetector`/`INetworkStatus`, `NETWORK_EVENTS`) are
 *   imported directly from `@stackra/contracts` — this package never
 *   re-exports them.
 */

import "reflect-metadata";

// ============================================================================
// Module
// ============================================================================
export { NetworkModule } from "./network.module";

// ============================================================================
// Services
// ============================================================================
export { NetworkService } from "./services";

// ============================================================================
// Detectors
// ============================================================================
export { NodeNetworkDetector } from "./detectors";

// ============================================================================
// Interfaces (package-owned only)
// ============================================================================
export type { NetworkModuleOptions, UseNetworkStatusResult } from "./interfaces";

// ============================================================================
// Hooks (cross-platform — shared by the react + native subpaths)
// ============================================================================
export { useNetworkStatus } from "./hooks";

// ============================================================================
// Config
// ============================================================================
/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./utils/define-config.util";

// ============================================================================
// Deprecation-shim re-export — lets consumers migrating a single
// file `import { registerAs } from '@stackra/network'` for one release
// cycle without changing the import path. Removed in v0.2; switch
// to `import { registerAs } from '@stackra/config'` at your own
// pace.
// ============================================================================
/** @deprecated Import `registerAs` directly from `@stackra/config`. Removed in v0.2. */
export { registerAs } from "@stackra/config";
