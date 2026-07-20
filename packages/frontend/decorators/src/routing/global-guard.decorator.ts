/**
 * @file global-guard.decorator.ts
 * @module @stackra/decorators/routing
 *
 * @description
 * `@GlobalGuard(...)` — thin sugar over `@Guard({ ..., global: true })`.
 * Accepts either an options object or a name-only shortcut.
 */

import type { IGuardOptions } from "@stackra/contracts";

import { Guard } from "./guard.decorator";

/**
 * Mark a class as a globally-registered routing guard.
 *
 * Equivalent to `@Guard({...options, global: true})`. Accepts a full
 * options object OR a name-only shortcut string.
 *
 * @param options - Guard descriptor or guard name.
 * @returns A `ClassDecorator` that stamps `global: true`.
 *
 * @example
 * ```typescript
 * // Options form:
 * @GlobalGuard({ name: 'anti-csrf', priority: 1000 })
 * export class AntiCsrfGuard implements ICanActivate { ... }
 *
 * // Name-only form:
 * @GlobalGuard('anti-csrf')
 * export class AntiCsrfGuard implements ICanActivate { ... }
 * ```
 */
export function GlobalGuard(options: Partial<IGuardOptions> | string): ClassDecorator {
  // Normalise the shortcut form. `IGuardOptions.name` is required so
  // a bare-name call still produces a valid descriptor.
  const descriptor: IGuardOptions =
    typeof options === "string"
      ? { name: options, global: true }
      : { ...options, name: options.name ?? "anonymous-guard", global: true };

  return Guard(descriptor);
}
