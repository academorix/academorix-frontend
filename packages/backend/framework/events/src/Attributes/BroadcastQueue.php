<?php

/**
 * @file packages/events/src/Attributes/BroadcastQueue.php
 *
 * @description
 * Class-level attribute that overrides the queue the broadcast job
 * dispatches to. Replaces the traditional
 * `public function broadcastQueue(): string { return '...'; }`
 * method with a single declarative statement.
 *
 * Applied by
 * {@see \Stackra\Events\Support\BroadcastConfigurator} whenever
 * the framework asks the event for its broadcast queue name. Takes
 * precedence over the `queue` argument passed to
 * {@see Broadcastable}, so events that want to override the queue
 * on a per-event basis can do so without touching the
 * `#[Broadcastable]` declaration.
 *
 * ## Non-repeatable
 *
 * An event has at most one broadcast queue.
 */

declare(strict_types=1);

namespace Stackra\Events\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final class BroadcastQueue
{
    /**
     * @param  string  $name  The queue the broadcast job is dispatched to. Must resolve to a
     *                        queue configured in the host app's `config/queue.php`.
     */
    public function __construct(
        public readonly string $name,
    ) {}
}
