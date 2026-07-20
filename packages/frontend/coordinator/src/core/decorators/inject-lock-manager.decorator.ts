/**
 * @file inject-lock-manager.decorator.ts
 * @module @stackra/coordinator/core/decorators
 * @description Parameter decorator for injecting the LockManager.
 */

import { Inject } from "@stackra/container";
import { TAB_LOCK_MANAGER } from "@/core/constants";

/**
 * Inject the LockManager service.
 *
 * @returns A parameter decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class AuthService {
 *   constructor(@InjectLockManager() private readonly locks: LockManager) {}
 * }
 * ```
 */
export function InjectLockManager(): ParameterDecorator {
  return Inject(TAB_LOCK_MANAGER);
}
