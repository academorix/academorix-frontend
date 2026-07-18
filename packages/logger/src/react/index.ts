/**
 * @file index.ts
 * @module @stackra/logger/react
 * @description React bindings for the logger system.
 *   Provides hooks for creating context-bound loggers in components and
 *   client-side reporters (HTTP batching, network error capture).
 *
 *   Note: the React error boundary previously exported here now lives in
 *   the dedicated `@stackra/error` package (`@stackra/error/react`), which
 *   logs through the same `LOGGER_MANAGER` contract.
 */

// ============================================================================
// Hooks
// ============================================================================
export { useLogger } from "./hooks/use-logger/use-logger.hook";
export { useLoggerChannel } from "./hooks/use-logger-channel/use-logger-channel.hook";

// ============================================================================
// Reporters
// ============================================================================
export { HttpReporter } from "./reporters/http.reporter";
export { NetworkCaptureReporter } from "./reporters/network-capture.reporter";
