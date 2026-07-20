/**
 * @file conflict-resolver-fn.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description A caller-supplied conflict resolver function.
 */

import type { IConflict } from "./conflict.interface";

/**
 * A caller-supplied conflict resolver function.
 *
 * Registered via `IConflictResolverConfig.customResolvers` (or at runtime
 * through the `ConflictResolver.registerCustomResolver` method) and invoked
 * by the resolver whenever a conflict lands in that collection. Return the
 * merged document synchronously or asynchronously.
 */
export type IConflictResolverFn<T = unknown> = (conflict: IConflict<T>) => Promise<T> | T;
