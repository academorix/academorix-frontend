<?php

/**
 * @file packages/events/src/Support/BroadcastMetadata.php
 *
 * @description
 * Immutable value object that captures the aggregated broadcasting
 * attributes ({@see \Stackra\Events\Attributes\Broadcastable},
 * {@see \Stackra\Events\Attributes\BroadcastOn},
 * {@see \Stackra\Events\Attributes\BroadcastAs},
 * {@see \Stackra\Events\Attributes\BroadcastQueue}) discovered on
 * a single event class.
 *
 * Produced by {@see EventDiscovery} and consumed by
 * {@see BroadcastConfigurator}, which uses it to answer the
 * framework's `broadcastOn()` / `broadcastAs()` / `broadcastQueue()`
 * queries without the event class needing to implement those
 * methods.
 */

declare(strict_types=1);

namespace Stackra\Events\Support;

final class BroadcastMetadata
{
    /**
     * @param  class-string     $eventClass   Fully-qualified event class this metadata applies to.
     * @param  list<string>     $channels     Channel names or channel-factory class-strings, in
     *                                         declaration order. `{property}` tokens are resolved
     *                                         against the event instance at broadcast time by
     *                                         {@see BroadcastConfigurator}.
     * @param  string|null      $channelType  Default channel type used for plain-string channels.
     *                                         One of `public`, `private`, `presence`, or `null` to
     *                                         defer to `events.broadcast.default_channel_type`.
     * @param  string|null      $broadcastAs  Custom broadcast name from `#[BroadcastAs]`, or `null`
     *                                         to fall back to the event's FQCN.
     * @param  string|null      $queue        Override queue name — the resolved value combines
     *                                         `#[BroadcastQueue]` (more specific) with the `queue`
     *                                         argument of `#[Broadcastable]` (less specific).
     *                                         `null` defers to the framework default.
     */
    public function __construct(
        public readonly string $eventClass,
        public readonly array $channels,
        public readonly ?string $channelType,
        public readonly ?string $broadcastAs,
        public readonly ?string $queue,
    ) {}

    /**
     * Serialise to a plain array suitable for `var_export()`.
     *
     * @return array{
     *   eventClass: class-string,
     *   channels: list<string>,
     *   channelType: string|null,
     *   broadcastAs: string|null,
     *   queue: string|null,
     * }
     */
    public function toArray(): array
    {
        return [
            'eventClass' => $this->eventClass,
            'channels' => $this->channels,
            'channelType' => $this->channelType,
            'broadcastAs' => $this->broadcastAs,
            'queue' => $this->queue,
        ];
    }

    /**
     * Rehydrate from the array produced by {@see self::toArray()}.
     *
     * @param  array{
     *   eventClass: class-string,
     *   channels: list<string>,
     *   channelType: string|null,
     *   broadcastAs: string|null,
     *   queue: string|null,
     * }  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            eventClass: $data['eventClass'],
            channels: array_values($data['channels']),
            channelType: $data['channelType'],
            broadcastAs: $data['broadcastAs'],
            queue: $data['queue'],
        );
    }
}
