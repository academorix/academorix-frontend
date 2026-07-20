/**
 * @file network.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the network subsystem.
 *
 *   Tokens live in contracts so cross-package consumers (sync, http retry,
 *   offline queues) can inject network detection without pulling in the
 *   `@stackra/network` runtime.
 */

/** Token for the platform-specific `INetworkDetector` implementation. */
export const NETWORK_DETECTOR = Symbol.for("NETWORK_DETECTOR");

/** Token for the high-level `NetworkService` (detector + event emission). */
export const NETWORK_SERVICE = Symbol.for("NETWORK_SERVICE");
