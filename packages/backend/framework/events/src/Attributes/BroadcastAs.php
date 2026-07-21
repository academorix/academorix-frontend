<?php

/**
 * @file packages/events/src/Attributes/BroadcastAs.php
 *
 * @description
 * Class-level attribute that overrides the wire-name used when the
 * framework broadcasts the event. Replaces the traditional
 * `public function broadcastAs(): string { return '...'; }`
 * method on an event class with a single declarative statement.
 *
 * Applied by
 * {@see \Stackra\Events\Support\BroadcastConfigurator} whenever
 * the framework asks the event for its broadcast name. Absent, the
 * framework uses the event's fully-qualified class name — the
 * default behaviour.
 *
 * ## Non-repeatable
 *
 * An event has at most one broadcast name — declaring
 * `#[BroadcastAs]` twice is a build-time error.
 */

declare(strict_types=1);

namespace Stackra\Events\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final class BroadcastAs
{
    /**
     * @param  string  $name  The wire-name broadcast to subscribers. Convention: a stable, dotted,
     *                        lower-snake-case identifier — e.g. `orders.created`, `chat.message.sent`.
     *                        Treat as a public API; renaming breaks every subscribed client.
     */
    public function __construct(
        public readonly string $name,
    ) {}
}
