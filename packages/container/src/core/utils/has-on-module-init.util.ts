/**
 * hasOnModuleInit Type Guard
 *
 * Checks if an object implements the `OnModuleInit` interface.
 * Used by the `InstanceLoader` to determine which providers need their
 * `onModuleInit()` hook called after instantiation.
 *
 * @module utils/has-on-module-init
 */

import type { OnModuleInit } from "@stackra/contracts";

/**
 * Type guard that checks if an object implements the `OnModuleInit` interface.
 *
 * @param instance - The object to check, typically a resolved provider instance
 * @returns `true` if the instance has an `onModuleInit` method
 *
 * @example
 * ```typescript
 * if (hasOnModuleInit(wrapper.instance)) {
 *   await wrapper.instance.onModuleInit();
 * }
 * ```
 */
export function hasOnModuleInit(instance: unknown): instance is OnModuleInit {
  return instance != null && typeof (instance as OnModuleInit).onModuleInit === "function";
}
