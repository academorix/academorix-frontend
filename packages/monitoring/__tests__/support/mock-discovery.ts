/**
 * @file mock-discovery.ts
 * @module @stackra/monitoring/__tests__/support
 * @description Hand-rolled `IDiscoveryService` for unit tests.
 *
 *   Wraps a fixed array of `IDiscoveryProvider`-shaped wrappers so
 *   specs can drive `getProvidersByMetadata()` deterministically —
 *   the loader under test only cares about the wrapper's `instance`
 *   field.
 */

import { getMetadata } from '@vivtel/metadata';
import type { IDiscoveryProvider, IDiscoveryService } from '@stackra/contracts';

/** One decorated class instance registered with the mock. */
export interface IMockProviderInput {
  instance: object;
}

/**
 * In-memory `IDiscoveryService`. Matches the real filter by inspecting
 * the actual `@vivtel/metadata` value on each class constructor.
 */
export class MockDiscoveryService implements IDiscoveryService {
  private readonly registered: IDiscoveryProvider[] = [];

  public constructor(inputs: IMockProviderInput[] = []) {
    for (const input of inputs) this.register(input);
  }

  public register(input: IMockProviderInput): this {
    const ctor = input.instance.constructor as Function;
    this.registered.push({
      instance: input.instance,
      metatype: ctor,
      name: ctor.name,
    });
    return this;
  }

  public getProviders(): IDiscoveryProvider[] {
    return [...this.registered];
  }

  public getProvidersByMetadata(key: string | symbol): IDiscoveryProvider[] {
    return this.registered.filter((wrapper) => {
      const ctor = wrapper.metatype;
      if (!ctor) return false;
      return getMetadata(key, ctor as object) !== undefined;
    });
  }
}
