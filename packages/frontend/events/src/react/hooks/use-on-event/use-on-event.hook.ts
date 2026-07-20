/**
 * @file use-on-event.hook.ts
 * @module @stackra/events/react
 * @description React hook for subscribing to events with automatic cleanup.
 *   Subscribes to an event on mount and unsubscribes on unmount (or when
 *   the event name changes). Prevents memory leaks from orphaned listeners.
 */

import { useEffect, useRef } from "react";
import { useInject } from "@stackra/container/react";
import { EVENT_EMITTER } from "@stackra/contracts";
import { EventEmitter } from "@/core/services/event-emitter.service";
import type { EventListener } from "@/core/interfaces/listener-entry.interface";

/**
 * Subscribe to an event with automatic cleanup on unmount.
 *
 * The handler is subscribed when the component mounts and automatically
 * unsubscribed when it unmounts or when the event name changes.
 * The handler reference is stable — changing the handler function
 * does NOT re-subscribe (it uses the latest ref).
 *
 * @param event - Event name or wildcard pattern to subscribe to
 * @param handler - Callback invoked when the event fires
 *
 * @example
 * ```typescript
 * function OrderNotification() {
 *   useOnEvent('order.created', (payload) => {
 *     toast.success(`New order: ${payload.orderId}`);
 *   });
 *
 *   return null; // renders nothing, just listens
 * }
 * ```
 *
 * @example
 * ```typescript
 * function ChatMessage({ channelId }: Props) {
 *   const [messages, setMessages] = useState<Message[]>([]);
 *
 *   useOnEvent(`chat.${channelId}.message`, (msg: Message) => {
 *     setMessages(prev => [...prev, msg]);
 *   });
 *
 *   return <MessageList messages={messages} />;
 * }
 * ```
 */
export function useOnEvent(event: string | symbol, handler: EventListener): void {
  const emitter = useInject<EventEmitter>(EVENT_EMITTER);

  // Keep a stable reference to the latest handler (avoids re-subscribing)
  const handlerRef = useRef<EventListener>(handler);
  handlerRef.current = handler;

  useEffect(() => {
    // Wrapper that always calls the latest handler ref
    const listener: EventListener = (...args: unknown[]) => {
      return handlerRef.current(...args);
    };

    emitter.on(event, listener);

    return () => {
      emitter.off(event, listener);
    };
  }, [emitter, event]);
}
