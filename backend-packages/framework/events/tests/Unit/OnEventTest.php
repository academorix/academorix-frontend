<?php

/**
 * @file packages/events/tests/Unit/OnEventTest.php
 *
 * @description
 * Unit coverage for the {@see \Academorix\Events\Attributes\OnEvent}
 * attribute. Every knob on the attribute has to survive the trip
 * from PHP source → reflection → downstream discovery, so these
 * tests validate the value-object surface — construction, default
 * values, target constants (class + repeatable), and immutability.
 */

declare(strict_types=1);

use Academorix\Events\Attributes\OnEvent;

it('captures the event class and defaults', function (): void {
    $attribute = new OnEvent(event: 'App\\Events\\UserRegistered');

    expect($attribute->event)->toBe('App\\Events\\UserRegistered');
    expect($attribute->priority)->toBe(0);
    expect($attribute->queued)->toBeFalse();
    expect($attribute->afterCommit)->toBeFalse();
});

it('captures every argument when set explicitly', function (): void {
    $attribute = new OnEvent(
        event: 'App\\Events\\UserRegistered',
        priority: 42,
        queued: true,
        afterCommit: true,
    );

    expect($attribute->event)->toBe('App\\Events\\UserRegistered');
    expect($attribute->priority)->toBe(42);
    expect($attribute->queued)->toBeTrue();
    expect($attribute->afterCommit)->toBeTrue();
});

it('is tagged with TARGET_CLASS + IS_REPEATABLE', function (): void {
    $reflection = new ReflectionClass(OnEvent::class);
    $attributes = $reflection->getAttributes(Attribute::class);

    expect($attributes)->toHaveCount(1);

    $flags = $attributes[0]->newInstance()->flags;
    expect($flags & Attribute::TARGET_CLASS)->toBe(Attribute::TARGET_CLASS);
    expect($flags & Attribute::IS_REPEATABLE)->toBe(Attribute::IS_REPEATABLE);
});

it('exposes readonly promoted properties', function (): void {
    $reflection = new ReflectionClass(OnEvent::class);

    foreach (['event', 'priority', 'queued', 'afterCommit'] as $property) {
        expect($reflection->getProperty($property)->isReadOnly())->toBeTrue();
    }
});

it('is final', function (): void {
    expect((new ReflectionClass(OnEvent::class))->isFinal())->toBeTrue();
});
