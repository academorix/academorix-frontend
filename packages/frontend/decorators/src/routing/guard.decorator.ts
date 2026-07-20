/**
 * @file guard.decorator.ts
 * @module @stackra/decorators/routing
 *
 * @description
 * The `@Guard(options)` class decorator — marks a class as a
 * discoverable routing guard. The guard implements `ICanActivate` and
 * the discovery loader wires it into the guard chain of every route
 * that references its `name`.
 */

import { GUARD_METADATA_KEY, type IGuardOptions } from "@stackra/contracts";

import { createDiscoverableClassDecorator, createMetadataReader } from "../core";

/**
 * Mark a class as a discoverable routing guard.
 *
 * @param options - Guard descriptor (`name`, `priority`, `global`).
 * @returns A `ClassDecorator` that stamps the descriptor + auto-applies
 *   `@Injectable()`.
 *
 * @example
 * ```typescript
 * import { Guard } from '@stackra/decorators/routing';
 * import type { ICanActivate, IGuardContext } from '@stackra/contracts';
 *
 * @Guard({ name: 'auth', priority: 1000 })
 * export class AuthGuard implements ICanActivate {
 *   public async canActivate(ctx: IGuardContext) { ... }
 * }
 * ```
 */
export const Guard = createDiscoverableClassDecorator<IGuardOptions>(GUARD_METADATA_KEY);

/** Reader for `@Guard(...)` metadata. */
export const guardMetadata = createMetadataReader<IGuardOptions>(GUARD_METADATA_KEY);
