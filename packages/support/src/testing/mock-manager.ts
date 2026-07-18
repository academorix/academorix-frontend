/**
 * @file mock-manager.ts
 * @module @stackra/support/testing
 * @description Concrete `Manager<T>` subclass useful when tests want a
 *   working single-driver manager without extending the abstract class
 *   themselves.
 */

import { Manager, type DriverCreator } from "../managers/manager";

/**
 * Recorded `extend()` invocation.
 */
export interface MockManagerExtendCall<T> {
  driver: string;
  creator: DriverCreator<T>;
}

/**
 * A concrete `Manager<T>` for tests.
 *
 * Register drivers up-front via the constructor's `drivers` map, then
 * call `driver('name')` to resolve them. Records every `extend()`
 * invocation on `.extendCalls` for assertions.
 *
 * @example
 * ```ts
 * const mgr = new MockManager<{ log: (msg: string) => void }>({
 *   default: 'console',
 *   drivers: { console: () => ({ log: vi.fn() }) },
 * });
 * const driver = mgr.driver();
 * driver.log('hi');
 * ```
 */
export class MockManager<T = unknown> extends Manager<T> {
  /** Every `extend()` call, in order. */
  public readonly extendCalls: MockManagerExtendCall<T>[] = [];

  private defaultDriver: string;

  public constructor(
    config: {
      /** Default driver name (returned by `getDefaultDriver()`). */
      default?: string;
      /** Map of driver name → creator function. */
      drivers?: Record<string, DriverCreator<T>>;
    } = {},
  ) {
    super();
    this.defaultDriver = config.default ?? "default";
    for (const [name, creator] of Object.entries(config.drivers ?? {})) {
      this.customCreators.set(name, creator);
    }
  }

  public getDefaultDriver(): string {
    return this.defaultDriver;
  }

  public setDefaultDriver(name: string): void {
    this.defaultDriver = name;
  }

  public override extend(name: string, creator: DriverCreator<T>): this {
    this.extendCalls.push({ driver: name, creator });
    return super.extend(name, creator);
  }
}
