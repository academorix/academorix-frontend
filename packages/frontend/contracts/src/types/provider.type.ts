/**
 * @file provider.type.ts
 * @module @stackra/contracts/types
 * @description Discriminated union of every provider shape accepted by
 *   the DI container.
 */

import type { Type } from "@/interfaces/type.interface";
import type {
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
} from "@/interfaces/modules";

/**
 * @publicApi
 */
export type Provider<T = any> =
  Type<any> | ClassProvider<T> | ValueProvider<T> | FactoryProvider<T> | ExistingProvider<T>;
