<?php

/**
 * @file packages/events/tests/Unit/ListensForTest.php
 *
 * @description
 * Unit coverage for the {@see \Stackra\Events\Attributes\ListensFor}
 * attribute. Mirrors {@see OnEventTest} but for the method-scoped
 * sibling — validates default `method: 'handle'` semantics, the
 * `TARGET_METHOD | IS_REPEATABLE` combination, and the readonly
 * immutability contract.
 */

declare(strict_types=1);

use Stackra\Events\Attributes\ListensFor;

it('captures the event class and defaults', function (): void {
    $attribute = new ListensFor(event: 'App\\Events\\UserRegistered');

    expect($attribute->event)->toBe('App\\Events\\UserRegistered');
    expect($attribute->method)->toBe('handle');
    expect($attribute->priority)->toBe(0);
    expect($attribute->queued)->toBeFalse();
    expect($attribute->afterCommit)->toBeFalse();
});

it('captures every argument when set explicitly', function (): void {
    $attribute = new ListensFor(
        event: 'App\\Events\\UserRegistered',
        method: 'onRegistered',
        priority: 100,
        queued: true,
        afterCommit: true,
    );

    expect($attribute->event)->toBe('App\\Events\\UserRegistered');
    expect($attribute->method)->toBe('onRegistered');
    expect($attribute->priority)->toBe(100);
    expect($attribute->queued)->toBeTrue();
    expect($attribute->afterCommit)->toBeTrue();
});

it('is tagged with TARGET_METHOD + IS_REPEATABLE', function (): void {
    $reflection = new ReflectionClass(ListensFor::class);
    $attributes = $reflection->getAttributes(Attribute::class);

    expect($attributes)->toHaveCount(1);

    $flags = $attributes[0]->newInstance()->flags;
    expect($flags & Attribute::TARGET_METHOD)->toBe(Attribute::TARGET_METHOD);
    expect($flags & Attribute::IS_REPEATABLE)->toBe(Attribute::IS_REPEATABLE);
});

it('exposes readonly promoted properties', function (): void {
    $reflection = new ReflectionClass(ListensFor::class);

    foreach (['event', 'method', 'priority', 'queued', 'afterCommit'] as $property) {
        expect($reflection->getProperty($property)->isReadOnly())->toBeTrue();
    }
});

it('is final', function (): void {
    expect((new ReflectionClass(ListensFor::class))->isFinal())->toBeTrue();
});
