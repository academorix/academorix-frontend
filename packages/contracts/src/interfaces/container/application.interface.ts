/**
 * @file application.interface.ts
 * @module @stackra/contracts/interfaces/container
 * @description Public contract for the bootstrapped application context.
 */

/**
 * Minimal application context contract.
 *
 * Represents a fully bootstrapped DI container that can resolve providers
 * by token. Services depend on this interface — not the full ApplicationContext.
 */
export interface IApplication {
  /**
   * Resolve a provider by its injection token.
   *
   * @typeParam T - The expected type of the resolved provider
   * @param token - Class, string, or symbol token
   * @returns The resolved provider instance
   */
  get<T = unknown>(token: unknown): T;

  /**
   * Resolve a provider or return undefined if not found.
   *
   * @typeParam T - The expected type of the resolved provider
   * @param token - Class, string, or symbol token
   * @returns The resolved provider instance, or undefined
   */
  getOptional?<T = unknown>(token: unknown): T | undefined;

  /**
   * Check whether a provider is registered.
   *
   * @param token - Class, string, or symbol token
   * @returns True if the token can be resolved
   */
  has?(token: unknown): boolean;
}
