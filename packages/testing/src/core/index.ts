/**
 * @file index.ts
 * @module @stackra/testing/core
 * @description Public API for @stackra/testing.
 *   Assertable primitives + time helpers.
 */

// ============================================================================
// Assertable primitives
// ============================================================================
export { Assertable } from "./assertable";
export { createAssertableProxy, ASSERTABLE_SYMBOL, type AssertableProxy } from "./assertable-proxy";
export { CallAssertion } from "./call-assertion";
export type { ICallRecord, IStubEntry } from "./interfaces";

// ============================================================================
// Time helpers
// ============================================================================
export { freezeTime, travelTo, restoreTime } from "./time-helpers";
