<?php

/**
 * @file packages/events/src/Attributes/Broadcastable.php
 *
 * @description
 * Class-level attribute that marks an Event class for broadcasting.
 * The events package wires up the equivalent of implementing
 * `Illuminate\Contracts\Broadcasting\ShouldBroadcast` at boot time,
 * so event authors declare the intent once and never have to
 * hand-roll `broadcastOn()` / `broadcastAs()` / `broadcastQueue()`
 * methods.
 *
 * ## Companion attributes
 *
 *   - {@see \Academorix\Events\Attributes\BroadcastOn}     — Names the channel(s).
 *   - {@see \Academorix\Events\Attributes\BroadcastAs}     — Overrides the broadcast name.
 *   - {@see \Academorix\Events\Attributes\BroadcastQueue}  — Overrides the broadcast queue.
 *
 * ## Semantics
 *
 *   - `channelType` sets the default type used when
 *     `#[BroadcastOn]` names a channel by string. When the string
 *     already looks like a channel factory class (i.e. resolves to
 *     an `Illuminate\Broadcasting\Channel` subclass), the type is
 *     ignored — the factory itself carries the type.
 *   - `queue` overrides the queue the broadcast job dispatches to.
 *     Equivalent to the framework's `broadcastQueue()` method. When
 *     null, Laravel's default broadcasting queue is used.
 *
 * ## Precedence
 *
 * A per-instance {@see BroadcastQueue} attribute overrides the
 * `queue` argument of `#[Broadcastable]` at wiring time. Declaring
 * both is not an error — the more specific one wins.
 */

declare(strict_types=1);

namespace Academorix\Events\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final class Broadcastable
{
    /**
     * Channel type: `public`, `private`, or `presence`. Used as
     * the default for every channel named by `#[BroadcastOn]` that
     * does not resolve to a channel-factory class.
     */
    public const CHANNEL_TYPE_PUBLIC = 'public';

    public const CHANNEL_TYPE_PRIVATE = 'private';

    public const CHANNEL_TYPE_PRESENCE = 'presence';

    /**
     * @param  'private'|'public'|'presence'|null  $channelType  Default channel type applied by
     *                                                            {@see \Academorix\Events\Support\BroadcastConfigurator}
     *                                                            when `#[BroadcastOn]` names a plain-string
     *                                                            channel. `null` defers to the config value
     *                                                            `events.broadcast.default_channel_type`.
     * @param  string|null                          $queue        Optional queue name that the broadcast
     *                                                            job is dispatched to. When `null`, the
     *                                                            framework's default broadcasting queue
     *                                                            is used.
     */
    public function __construct(
        public readonly ?string $channelType = null,
        public readonly ?string $queue = null,
    ) {}
}
