/**
 * @file discovery-provider.interface.ts
 * @module @stackra/contracts/interfaces/discovery
 * @description A discovered provider instance with its metadata.
 */

/**
 * A discovered provider instance with its metadata.
 */
export interface IDiscoveryProvider {
  /** The live provider instance (already resolved by the container). */
  instance: unknown;

  /** The class constructor (metatype), or null for value/factory providers. */
  metatype: Function | null;

  /** Human-readable provider name (usually the class name). */
  name: string;

  /** The injection token used to register this provider. */
  token?: unknown;
}
