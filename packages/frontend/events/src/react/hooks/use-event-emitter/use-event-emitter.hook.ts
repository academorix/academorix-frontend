/**
 * @file use-event-emitter.hook.ts
 * @module @stackra/events/react
 * @description React hook for accessing the EventEmitter from DI.
 */

import { useInject } from "@stackra/container/react";
import { EVENT_EMITTER } from "@stackra/contracts";
import { EventEmitter } from "@/core/services/event-emitter.service";

/**
 * Access the EventEmitter instance from the DI container.
 *
 * @returns The singleton EventEmitter
 *
 * @example
 * ```typescript
 * function OrderButton({ orderId }: Props) {
 *   const events = useEventEmitter();
 *
 *   const handleClick = () => {
 *     events.emit('order.confirmed', { orderId });
 *   };
 *
 *   return <button onClick={handleClick}>Confirm</button>;
 * }
 * ```
 */
export function useEventEmitter(): EventEmitter {
  return useInject<EventEmitter>(EVENT_EMITTER);
}
