<?php

/**
 * @file packages/events/src/Attributes/BroadcastOn.php
 *
 * @description
 * Class-level, repeatable attribute that names the channel(s) an
 * event broadcasts on. Replaces the framework's traditional
 * `public function broadcastOn(): array { ... }` method with a pure
 * metadata declaration.
 *
 * ## Channel entries
 *
 * Each entry may be:
 *
 *   - A **plain string** — treated as a channel name and wrapped in
 *     the default channel type declared on {@see Broadcastable}
 *     (falling back to `events.broadcast.default_channel_type`).
 *     Example: `'orders.42'`, `'chat.42.messages'`.
 *
 *   - A **channel-factory class-string** — a fully-qualified class
 *     name that extends `Illuminate\Broadcasting\Channel` (or its
 *     `PrivateChannel` / `PresenceChannel` subclasses). The wiring
 *     resolves the class through the container and uses the
 *     resulting instance directly.
 *
 *   - A **channel placeholder** — a string with `{property}`
 *     tokens (e.g. `'orders.{order->id}'`) that
 *     {@see \Academorix\Events\Support\BroadcastConfigurator}
 *     interpolates against the event instance at broadcast time.
 *
 * ## Repeatable
 *
 * Stack multiple `#[BroadcastOn(...)]` attributes to broadcast on
 * more than one channel. The variadic constructor also accepts
 * several channels in a single attribute for shorter declarations:
 *
 *     #[BroadcastOn('orders.{order->id}', 'admins')]
 */

declare(strict_types=1);

namespace Academorix\Events\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final class BroadcastOn
{
    /**
     * Channel names or factory class-strings this event is
     * broadcast on. Stored as an immutable list so downstream
     * consumers may safely enumerate without defensive copies.
     *
     * @var list<string>
     */
    public readonly array $channels;

    /**
     * @param  string  ...$channels  Channel names or channel-factory class-strings. See the file-level
     *                                docblock for entry semantics.
     */
    public function __construct(string ...$channels)
    {
        $this->channels = array_values($channels);
    }
}
