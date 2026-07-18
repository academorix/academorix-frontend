/**
 * @file injection-token.type.ts
 * @module @stackra/contracts/types
 * @description Discriminated union of every value that can identify a
 *   provider in the DI container.
 */

import type { Abstract } from "@/interfaces/abstract.interface";
import type { Type } from "@/interfaces/type.interface";

/**
 * Anything the DI container accepts as a provider identity.
 *
 * @publicApi
 */
export type InjectionToken<T = any> = string | symbol | Type<T> | Abstract<T> | Function;
