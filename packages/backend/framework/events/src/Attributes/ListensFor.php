<?php

/**
 * @file packages/events/src/Attributes/ListensFor.php
 *
 * @description
 * Method-level, repeatable attribute that binds a specific listener
 * method to an event class. It's the sibling of
 * {@see \Stackra\Events\Attributes\OnEvent} — same semantics,
 * different placement: `#[OnEvent]` sits on the class and hooks into
 * `handle()`, whereas `#[ListensFor]` sits on a method and lets one
 * class subscribe to several events via distinct entry points.
 *
 * ## When to prefer each
 *
 *   - Use `#[OnEvent]` on the class when a listener does one thing.
 *   - Use `#[ListensFor]` on individual methods when a class is the
 *     natural home for several handlers — e.g. a `UserAudit`
 *     listener that reacts to `UserRegistered`, `UserSuspended`,
 *     and `UserDeleted` on three different methods.
 *
 * ## Discovery
 *
 * Discovered via `olvlvl/composer-attribute-collector`'s
 * `Attributes::findTargetMethods(ListensFor::class)`. The scanner
 * registers each entry as
 * `Event::listen($event, [$listenerClass, $method], priority)`.
 *
 * ## Repeatable
 *
 * Stack multiple `#[ListensFor(...)]` attributes on a single method
 * to have that method react to more than one event (rare but useful
 * when the payloads share a shape).
 */

declare(strict_types=1);

namespace Stackra\Events\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final class ListensFor
{
    /**
     * @param  class-string  $event        Fully-qualified event class this method responds to.
     * @param  string        $method       Method on the enclosing class that receives the event.
     *                                     Defaults to `handle`, mirroring the Laravel convention.
     *                                     The attribute is placed on THAT method — the argument
     *                                     is only kept for symmetry with {@see OnEvent} so both
     *                                     attributes share a resolver.
     * @param  int           $priority     Dispatcher priority — higher fires earlier. Passed to
     *                                     `Illuminate\Events\Dispatcher::listen()`.
     * @param  bool          $queued       When true, the listener is registered on the queue.
     *                                     See {@see OnEvent::$queued} for detail.
     * @param  bool          $afterCommit  When true, fire only after the surrounding DB
     *                                     transaction commits. See {@see OnEvent::$afterCommit}.
     */
    public function __construct(
        public readonly string $event,
        public readonly string $method = 'handle',
        public readonly int $priority = 0,
        public readonly bool $queued = false,
        public readonly bool $afterCommit = false,
    ) {}
}
