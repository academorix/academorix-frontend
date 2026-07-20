/**
 * @file index.ts
 * @module @stackra/actions/testing
 * @description Test doubles for `@stackra/actions` — a mock dispatcher,
 *   mock registry, and helper assertions for verifying dispatched actions.
 */

export { createMockDispatcher, type IMockDispatcher } from "./create-mock-dispatcher";
export { createMockRegistry, type IMockRegistry } from "./create-mock-registry";
export { assertActionDispatched } from "./assert-action-dispatched";
