/**
 * @file inject-realtime.decorator.ts
 * @module @stackra/realtime/core/decorators
 * @description Parameter decorators for injecting realtime services.
 */

import { Inject } from "@stackra/container";
import { REALTIME_MANAGER } from "@stackra/contracts";

/**
 * Inject the RealtimeManager service.
 *
 * @returns A parameter decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class NotificationService {
 *   constructor(@InjectRealtimeManager() private readonly realtime: RealtimeManager) {}
 * }
 * ```
 */
export function InjectRealtimeManager(): ParameterDecorator {
  return Inject(REALTIME_MANAGER);
}
