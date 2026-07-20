/**
 * @file guard-entry.interface.ts
 * @module @stackra/routing/core/interfaces
 * @description Internal registry entry for a discovered guard.
 *
 *   Held by `GuardRegistryService`. `IGuardOptions` + `ICanActivate`
 *   come from `@stackra/contracts` — this shape is package-owned
 *   because it merges options + the runtime class-ref pair that
 *   the discovery loader hands over.
 */

import type { ICanActivate, IGuardOptions } from "@stackra/contracts";

/**
 * A registered guard entry.
 */
export interface IGuardEntry {
  /** Options stamped by the `@Guard(...)` decorator. */
  readonly options: IGuardOptions;

  /**
   * Class constructor discovered in the DI graph. The registry keeps
   * the constructor (not the instance) so downstream services can
   * resolve the instance from the container at call time.
   */
  readonly ctor: new (...args: never[]) => ICanActivate;

  /**
   * Order in which the guard was registered. Ties in priority are
   * broken by ascending declaration index (first-registered wins).
   */
  readonly declarationIndex: number;
}
