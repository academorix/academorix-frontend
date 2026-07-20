/**
 * @file mock-discovery.ts
 * @module @stackra/scheduler/__tests__/support
 * @description Hand-rolled `IDiscoveryService` for unit tests.
 *
 *   Filters registered wrappers by the metadata actually attached to
 *   their class constructor — same shape as the real discovery
 *   service, no reliance on a global container.
 */

import { getMetadata } from '@vivtel/metadata';
import type { IDiscoveryProvider, IDiscoveryService } from '@stackra/contracts';

/** One decorated class instance registered with the mock. */
export interface IMockProviderInput {
  instance: object;
}

/** In-memory `IDiscoveryService` for spec code. */
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
