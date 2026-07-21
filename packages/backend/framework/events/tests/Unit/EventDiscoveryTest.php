<?php

/**
 * @file packages/events/tests/Unit/EventDiscoveryTest.php
 *
 * @description
 * Unit coverage for {@see \Stackra\Events\Support\EventDiscovery}.
 *
 * ## Strategy — inject a fake DiscoversAttributes
 *
 * The scanner talks to the unified
 * {@see \Stackra\Foundation\Contracts\DiscoversAttributes}
 * contract. Tests supply an anonymous-class implementation whose
 * `forClass()` / `forMethod()` methods return hand-built target
 * lists ({@see \Stackra\Foundation\Discovery\ClassTarget} /
 * {@see \Stackra\Foundation\Discovery\MethodTarget}). No
 * `composer dump-autoload` is needed for the fixtures.
 */

declare(strict_types=1);

use Stackra\Events\Attributes\AfterCommit;
use Stackra\Events\Attributes\Broadcastable;
use Stackra\Events\Attributes\BroadcastAs;
use Stackra\Events\Attributes\BroadcastOn;
use Stackra\Events\Attributes\BroadcastQueue;
use Stackra\Events\Attributes\ListensFor;
use Stackra\Events\Attributes\OnEvent;
use Stackra\Events\Support\DiscoveryManifest;
use Stackra\Events\Support\EventDiscovery;
use Stackra\Events\Support\ListenerBinding;
use Stackra\Foundation\Contracts\DiscoversAttributes;
use Stackra\Foundation\Discovery\ClassTarget;
use Stackra\Foundation\Discovery\MethodTarget;

/**
 * Build an in-memory {@see DiscoversAttributes} that returns the
 * supplied fixture map. Missing attribute classes yield `[]`.
 *
 * @param  array<class-string, list<ClassTarget<object>|MethodTarget<object>>>  $sources
 */
function eventsDiscoveryFrom(array $sources): EventDiscovery
{
    /** @var DiscoversAttributes $fake */
    $fake = new class ($sources) implements DiscoversAttributes
    {
        /**
         * @param  array<class-string, list<object>>  $sources
         */
        public function __construct(private readonly array $sources) {}

        public function forClass(string $attributeClass): iterable
        {
            /** @var list<ClassTarget<object>> $rows */
            $rows = array_values(array_filter(
                $this->sources[$attributeClass] ?? [],
                static fn ($t): bool => $t instanceof ClassTarget,
            ));

            return $rows;
        }

        public function forMethod(string $attributeClass): iterable
        {
            /** @var list<MethodTarget<object>> $rows */
            $rows = array_values(array_filter(
                $this->sources[$attributeClass] ?? [],
                static fn ($t): bool => $t instanceof MethodTarget,
            ));

            return $rows;
        }

        public function forProperty(string $attributeClass): iterable
        {
            unset($attributeClass);

            return [];
        }

        public function forParameter(string $attributeClass): iterable
        {
            unset($attributeClass);

            return [];
        }
    };

    return new EventDiscovery(discovery: $fake);
}

// -----------------------------------------------------------------
// Listener bindings from #[OnEvent] and #[ListensFor].
// -----------------------------------------------------------------

it('translates #[OnEvent] targets into listener bindings', function (): void {
    $discovery = eventsDiscoveryFrom([
        OnEvent::class => [
            new ClassTarget(
                className: 'App\\Listeners\\SendWelcome',
                attribute: new OnEvent(event: 'App\\Events\\UserRegistered', priority: 42),
            ),
        ],
    ]);

    $manifest = $discovery->discover();

    expect($manifest->listeners)->toHaveCount(1);

    /** @var ListenerBinding $binding */
    $binding = $manifest->listeners[0];

    expect($binding->eventClass)->toBe('App\\Events\\UserRegistered');
    expect($binding->listenerClass)->toBe('App\\Listeners\\SendWelcome');
    expect($binding->method)->toBe('handle');
    expect($binding->priority)->toBe(42);
    expect($binding->queued)->toBeFalse();
    expect($binding->afterCommit)->toBeFalse();
});

it('translates #[ListensFor] targets into listener bindings with the declared method', function (): void {
    $discovery = eventsDiscoveryFrom([
        ListensFor::class => [
            new MethodTarget(
                className: 'App\\Listeners\\UserAudit',
                methodName: 'onRegistered',
                attribute: new ListensFor(event: 'App\\Events\\UserRegistered', method: 'onRegistered'),
            ),
            new MethodTarget(
                className: 'App\\Listeners\\UserAudit',
                methodName: 'onSuspended',
                attribute: new ListensFor(event: 'App\\Events\\UserSuspended', method: 'onSuspended', queued: true),
            ),
        ],
    ]);

    $manifest = $discovery->discover();

    expect($manifest->listeners)->toHaveCount(2);
    expect($manifest->listeners[0]->method)->toBe('onRegistered');
    expect($manifest->listeners[1]->method)->toBe('onSuspended');
    expect($manifest->listeners[1]->queued)->toBeTrue();
});

it('folds the class-level #[AfterCommit] marker into every attribute-derived binding', function (): void {
    $discovery = eventsDiscoveryFrom([
        OnEvent::class => [
            new ClassTarget(
                className: 'App\\Listeners\\SendWelcome',
                attribute: new OnEvent(event: 'App\\Events\\UserRegistered'),
            ),
        ],
        AfterCommit::class => [
            new ClassTarget(className: 'App\\Listeners\\SendWelcome', attribute: new AfterCommit()),
        ],
    ]);

    $manifest = $discovery->discover();

    expect($manifest->listeners[0]->afterCommit)->toBeTrue();
});

it('preserves per-attribute afterCommit when the class has no marker', function (): void {
    $discovery = eventsDiscoveryFrom([
        OnEvent::class => [
            new ClassTarget(
                className: 'App\\Listeners\\SendWelcome',
                attribute: new OnEvent(event: 'App\\Events\\UserRegistered', afterCommit: true),
            ),
        ],
    ]);

    expect($discovery->discover()->listeners[0]->afterCommit)->toBeTrue();
});

// -----------------------------------------------------------------
// Broadcast metadata aggregation.
// -----------------------------------------------------------------

it('aggregates broadcasting attributes into per-event metadata', function (): void {
    $discovery = eventsDiscoveryFrom([
        Broadcastable::class => [
            new ClassTarget(
                className: 'App\\Events\\OrdersCreated',
                attribute: new Broadcastable(channelType: 'public', queue: 'broadcasts'),
            ),
        ],
        BroadcastOn::class => [
            new ClassTarget(className: 'App\\Events\\OrdersCreated', attribute: new BroadcastOn('orders', 'admins')),
        ],
        BroadcastAs::class => [
            new ClassTarget(className: 'App\\Events\\OrdersCreated', attribute: new BroadcastAs('orders.created')),
        ],
        BroadcastQueue::class => [
            new ClassTarget(className: 'App\\Events\\OrdersCreated', attribute: new BroadcastQueue('priority-broadcasts')),
        ],
    ]);

    $manifest = $discovery->discover();

    expect($manifest->broadcastMetadata)->toHaveKey('App\\Events\\OrdersCreated');

    $meta = $manifest->broadcastMetadata['App\\Events\\OrdersCreated'];

    expect($meta->channels)->toBe(['orders', 'admins']);
    expect($meta->channelType)->toBe('public');
    expect($meta->broadcastAs)->toBe('orders.created');
    // BroadcastQueue is more specific than Broadcastable's queue argument.
    expect($meta->queue)->toBe('priority-broadcasts');
});

it('falls back to Broadcastable.queue when no #[BroadcastQueue] is present', function (): void {
    $discovery = eventsDiscoveryFrom([
        Broadcastable::class => [
            new ClassTarget(
                className: 'App\\Events\\OrdersCreated',
                attribute: new Broadcastable(queue: 'default-broadcasts'),
            ),
        ],
        BroadcastOn::class => [
            new ClassTarget(className: 'App\\Events\\OrdersCreated', attribute: new BroadcastOn('orders')),
        ],
    ]);

    $meta = $discovery->discover()->broadcastMetadata['App\\Events\\OrdersCreated'];
    expect($meta->queue)->toBe('default-broadcasts');
});

it('yields an empty metadata map when no class carries #[Broadcastable]', function (): void {
    $discovery = eventsDiscoveryFrom([
        BroadcastOn::class => [
            new ClassTarget(className: 'App\\Events\\Detached', attribute: new BroadcastOn('orphaned')),
        ],
    ]);

    expect($discovery->discover()->broadcastMetadata)->toBe([]);
});

// -----------------------------------------------------------------
// Manifest round-trip — critical for the on-disk cache path.
// -----------------------------------------------------------------

it('round-trips a manifest through toArray()/fromArray() faithfully', function (): void {
    $original = eventsDiscoveryFrom([
        OnEvent::class => [
            new ClassTarget(
                className: 'App\\Listeners\\Foo',
                attribute: new OnEvent(event: 'App\\Events\\Bar', priority: 7, queued: true, afterCommit: true),
            ),
        ],
        Broadcastable::class => [
            new ClassTarget(className: 'App\\Events\\Bar', attribute: new Broadcastable(channelType: 'presence')),
        ],
        BroadcastOn::class => [
            new ClassTarget(className: 'App\\Events\\Bar', attribute: new BroadcastOn('room.{id}')),
        ],
    ])->discover();

    $rehydrated = DiscoveryManifest::fromArray($original->toArray());

    expect($rehydrated->listeners[0]->eventClass)->toBe($original->listeners[0]->eventClass);
    expect($rehydrated->listeners[0]->priority)->toBe(7);
    expect($rehydrated->listeners[0]->afterCommit)->toBeTrue();
    expect($rehydrated->broadcastMetadata['App\\Events\\Bar']->channels)->toBe(['room.{id}']);
    expect($rehydrated->broadcastMetadata['App\\Events\\Bar']->channelType)->toBe('presence');
});
