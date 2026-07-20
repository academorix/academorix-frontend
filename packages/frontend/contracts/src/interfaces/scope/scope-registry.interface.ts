/**
 * @file scope-registry.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description Public contract for the scope consumer registry.
 */

import type { IScopeConsumerConfig } from "./scope-types.interface";

/**
 * Scope registry contract.
 *
 * Manages consumer package registrations. Each consumer (settings,
 * permissions, feature flags, ...) registers with a unique namespace so
 * their values are isolated from other consumers.
 */
export interface IScopeRegistry {
  /**
   * Register a consumer package with a unique namespace.
   *
   * @param namespace - Unique namespace (1-64 chars, lowercase alphanumeric + underscores).
   * @param config - Consumer configuration.
   * @throws When the namespace is already registered.
   */
  register(namespace: string, config: IScopeConsumerConfig): void;

  /**
   * Get a registered consumer's configuration.
   *
   * @param namespace - Consumer namespace.
   * @returns Config, or `undefined` if not registered.
   */
  getConsumer(namespace: string): IScopeConsumerConfig | undefined;

  /**
   * List all registered consumer namespaces.
   *
   * @returns Array of namespace strings.
   */
  listConsumers(): string[];
}
