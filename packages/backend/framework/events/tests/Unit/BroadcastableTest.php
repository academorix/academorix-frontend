<?php

/**
 * @file packages/events/tests/Unit/BroadcastableTest.php
 *
 * @description
 * Unit coverage for the broadcasting attribute family:
 *
 *   - {@see \Stackra\Events\Attributes\Broadcastable}
 *   - {@see \Stackra\Events\Attributes\BroadcastOn}
 *   - {@see \Stackra\Events\Attributes\BroadcastAs}
 *   - {@see \Stackra\Events\Attributes\BroadcastQueue}
 *   - {@see \Stackra\Events\Support\BroadcastConfigurator}
 *
 * The Configurator tests are pure-unit — no Testbench boot — so
 * they exercise the resolver's channel-type wrapping, placeholder
 * interpolation, and factory class-string branch against
 * hand-built {@see \Stackra\Events\Support\BroadcastMetadata}
 * entries.
 */

declare(strict_types=1);

use Stackra\Events\Attributes\Broadcastable;
use Stackra\Events\Attributes\BroadcastAs;
use Stackra\Events\Attributes\BroadcastOn;
use Stackra\Events\Attributes\BroadcastQueue;
use Stackra\Events\Support\BroadcastConfigurator;
use Stackra\Events\Support\BroadcastMetadata;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;

/**
 * Minimal channel-factory subclass used to prove the resolver
 * instantiates factory class-strings and hands them the event.
 * Kept out of the anonymous-class path because the resolver's
 * `class_exists()` check needs a top-level, resolvable name.
 */
if (! class_exists('EventsPackageChannelFactoryFixture', false)) {
    /** @phpstan-ignore-next-line */
    final class EventsPackageChannelFactoryFixture extends Channel
    {
        public function __construct(public readonly object $event)
        {
            parent::__construct('factory.' . spl_object_id($event));
        }
    }
}

// -----------------------------------------------------------------
// Attribute value-object surface.
// -----------------------------------------------------------------

it('#[Broadcastable] captures the optional channel type and queue', function (): void {
    $default = new Broadcastable();
    expect($default->channelType)->toBeNull();
    expect($default->queue)->toBeNull();

    $custom = new Broadcastable(channelType: Broadcastable::CHANNEL_TYPE_PRESENCE, queue: 'broadcasts');
    expect($custom->channelType)->toBe('presence');
    expect($custom->queue)->toBe('broadcasts');
});

it('#[BroadcastOn] captures a variadic channel list', function (): void {
    $attribute = new BroadcastOn('orders.{order->id}', 'admins', 'App\\Broadcasting\\OrdersChannel');

    expect($attribute->channels)->toBe([
        'orders.{order->id}',
        'admins',
        'App\\Broadcasting\\OrdersChannel',
    ]);
});

it('#[BroadcastAs] captures the wire name', function (): void {
    $attribute = new BroadcastAs('orders.created');
    expect($attribute->name)->toBe('orders.created');
});

it('#[BroadcastQueue] captures the queue name', function (): void {
    $attribute = new BroadcastQueue('broadcasts');
    expect($attribute->name)->toBe('broadcasts');
});

it('every broadcasting attribute is TARGET_CLASS', function (): void {
    foreach ([Broadcastable::class, BroadcastOn::class, BroadcastAs::class, BroadcastQueue::class] as $class) {
        $reflection = new ReflectionClass($class);
        $attribute = $reflection->getAttributes(Attribute::class)[0]->newInstance();
        expect($attribute->flags & Attribute::TARGET_CLASS)->toBe(Attribute::TARGET_CLASS);
    }
});

it('only #[BroadcastOn] is repeatable', function (): void {
    $repeatable = (new ReflectionClass(BroadcastOn::class))
        ->getAttributes(Attribute::class)[0]
        ->newInstance();
    expect($repeatable->flags & Attribute::IS_REPEATABLE)->toBe(Attribute::IS_REPEATABLE);

    foreach ([Broadcastable::class, BroadcastAs::class, BroadcastQueue::class] as $class) {
        $attribute = (new ReflectionClass($class))
            ->getAttributes(Attribute::class)[0]
            ->newInstance();
        expect($attribute->flags & Attribute::IS_REPEATABLE)->toBe(0);
    }
});

// -----------------------------------------------------------------
// BroadcastConfigurator behaviour.
// -----------------------------------------------------------------

it('reports registered event classes as broadcastable', function (): void {
    $configurator = new BroadcastConfigurator();

    /** @var class-string $eventClass */
    $eventClass = 'App\\Events\\OrdersCreated';

    $configurator->register(new BroadcastMetadata(
        eventClass: $eventClass,
        channels: ['orders'],
        channelType: Broadcastable::CHANNEL_TYPE_PUBLIC,
        broadcastAs: 'orders.created',
        queue: 'broadcasts',
    ));

    expect($configurator->isBroadcastable($eventClass))->toBeTrue();
    expect($configurator->isBroadcastable('App\\Events\\Unknown'))->toBeFalse();
    expect($configurator->broadcastNameFor($eventClass))->toBe('orders.created');
    expect($configurator->broadcastQueueFor($eventClass))->toBe('broadcasts');
});

it('wraps plain channel names using the effective channel type', function (): void {
    $configurator = new BroadcastConfigurator();

    // Anonymous fixture event — configurator only cares about the class-string key.
    $event = new class
    {
    };

    $configurator->register(new BroadcastMetadata(
        eventClass: $event::class,
        channels: ['orders', 'admins'],
        channelType: Broadcastable::CHANNEL_TYPE_PUBLIC,
        broadcastAs: null,
        queue: null,
    ));

    $channels = $configurator->channelsFor($event);

    expect($channels)->toHaveCount(2);
    expect($channels[0])->toBeInstanceOf(Channel::class);
    expect($channels[0])->not->toBeInstanceOf(PrivateChannel::class);
});

it('falls back to the default channel type when none is declared', function (): void {
    $configurator = new BroadcastConfigurator(Broadcastable::CHANNEL_TYPE_PRESENCE);

    $event = new class
    {
    };

    $configurator->register(new BroadcastMetadata(
        eventClass: $event::class,
        channels: ['presence-room'],
        channelType: null,
        broadcastAs: null,
        queue: null,
    ));

    $channels = $configurator->channelsFor($event);

    expect($channels[0])->toBeInstanceOf(PresenceChannel::class);
});

it('produces PrivateChannel by default', function (): void {
    $configurator = new BroadcastConfigurator();

    $event = new class
    {
    };

    $configurator->register(new BroadcastMetadata(
        eventClass: $event::class,
        channels: ['private-room'],
        channelType: null,
        broadcastAs: null,
        queue: null,
    ));

    $channels = $configurator->channelsFor($event);

    expect($channels[0])->toBeInstanceOf(PrivateChannel::class);
});

it('interpolates placeholders against the event instance', function (): void {
    $configurator = new BroadcastConfigurator();

    /**
     * Fixture event exposing a nested `id` property so we can verify
     * one-level `->` navigation in the interpolator.
     */
    $order = new class
    {
        public int $id = 42;
    };

    $event = new class($order)
    {
        public function __construct(public readonly object $order)
        {
        }
    };

    $configurator->register(new BroadcastMetadata(
        eventClass: $event::class,
        channels: ['orders.{order->id}'],
        channelType: Broadcastable::CHANNEL_TYPE_PUBLIC,
        broadcastAs: null,
        queue: null,
    ));

    $channels = $configurator->channelsFor($event);

    expect($channels[0]->name)->toBe('orders.42');
});

it('resolves channel-factory class-strings via the container-free constructor', function (): void {
    $configurator = new BroadcastConfigurator();

    $event = new class
    {
    };

    $configurator->register(new BroadcastMetadata(
        eventClass: $event::class,
        channels: [EventsPackageChannelFactoryFixture::class],
        channelType: null,
        broadcastAs: null,
        queue: null,
    ));

    $channels = $configurator->channelsFor($event);
    expect($channels[0])->toBeInstanceOf(EventsPackageChannelFactoryFixture::class);
    expect($channels[0])->toBeInstanceOf(Channel::class);
});
