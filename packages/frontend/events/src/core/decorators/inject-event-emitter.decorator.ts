/**
 * @file inject-event-emitter.decorator.ts
 * @module @stackra/events/core/decorators
 * @description Parameter decorator for injecting the EventEmitter via DI token.
 *   Sugar over `@Inject(EVENT_EMITTER)` — saves an import.
 */

import { Inject } from "@stackra/container";

import { EVENT_EMITTER } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Inject the EventEmitter instance into a constructor parameter.
 *
 * Equivalent to `@Inject(EVENT_EMITTER)` but more readable.
 *
 * @returns A parameter decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class NotificationService {
 *   constructor(@InjectEventEmitter() private readonly events: EventEmitter) {}
 *
 *   notify(userId: string, message: string): void {
 *     this.events.emit('notification.sent', { userId, message });
 *   }
 * }
 * ```
 */
export function InjectEventEmitter(): ParameterDecorator {
  return Inject(EVENT_EMITTER);
}
