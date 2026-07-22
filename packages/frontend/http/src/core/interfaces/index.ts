/**
 * @file index.ts
 * @module @stackra/http/core/interfaces
 * @description Public API barrel for the core `interfaces` category — re-exports
 *   the DI-facing contracts (`IHttpClientDeps`), SSE parser options, and the
 *   pluggable stream-parser interface.
 */

export * from "./http-client-deps.interface";
export * from "./sse-parser-options.interface";
export * from "./stream-parser.interface";
