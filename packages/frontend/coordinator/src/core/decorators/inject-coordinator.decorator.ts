/**
 * @file inject-coordinator.decorator.ts
 * @module @stackra/coordinator/core/decorators
 * @description Parameter decorator for injecting the TabCoordinator.
 */

import { Inject } from "@stackra/container";
import { TAB_COORDINATOR } from "@stackra/contracts";

/**
 * Inject the TabCoordinator service.
 *
 * @returns A parameter decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class SyncService {
 *   constructor(@InjectCoordinator() private readonly coordinator: TabCoordinator) {}
 * }
 * ```
 */
export function InjectCoordinator(): ParameterDecorator {
  return Inject(TAB_COORDINATOR);
}
