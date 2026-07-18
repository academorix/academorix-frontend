/**
 * @file inject-queue.decorator.ts
 * @module @stackra/queue/core/decorators
 * @description Parameter decorator for injecting a QueueHandle by name.
 */

import { Inject } from "@stackra/container";
import { getQueueToken } from "@/core/utils/token-builders.util";

/**
 * Inject a QueueHandle for a specific queue.
 *
 * @param queue - Queue name (defaults to 'default')
 * @param connection - Connection name (optional)
 * @returns A parameter decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class EmailService {
 *   constructor(@InjectQueue('emails') private readonly emailQueue: QueueHandle) {}
 * }
 * ```
 */
export function InjectQueue(queue?: string, connection?: string): ParameterDecorator {
  return Inject(getQueueToken(queue, connection));
}
