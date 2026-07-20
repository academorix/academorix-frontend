/**
 * @file action-handler.decorator.ts
 * @module @stackra/actions/core/decorators
 * @description `@ActionHandler(kind)` — stamps the class with the
 *   `ACTION_HANDLER_METADATA` key so `HandlerLoader` picks it up at
 *   bootstrap.
 */

import { Injectable } from "@stackra/container";
import { ACTION_HANDLER_METADATA } from "@stackra/contracts";

/**
 * Class decorator that stamps a handler class as discoverable.
 *
 * @example
 * ```ts
 * @ActionHandler('orders.approve')
 * export class ApproveOrderHandler implements IActionHandler<...> {
 *   public readonly kind = 'orders.approve';
 *   public async execute(descriptor, context) { … }
 * }
 * ```
 */
export function ActionHandler(kind: string): ClassDecorator {
  return (target) => {
    Injectable()(target as never);
    Reflect.defineMetadata(ACTION_HANDLER_METADATA, kind, target);
  };
}
