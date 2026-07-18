/**
 * @file container.interface.ts
 * @module @stackra/contracts/interfaces/container
 * @description Minimal DI container interface for testing and inspection.
 */

/**
 * Minimal DI container interface for testing and inspection.
 *
 * Used by testing matchers and inspection tools that need to check
 * token registration without the full container implementation.
 */
export interface IContainer {
  /** Check if a token is registered in the container. */
  has?(token: symbol | string): boolean;

  /** Resolve a token from the container. */
  get?(token: symbol | string): unknown;
}
