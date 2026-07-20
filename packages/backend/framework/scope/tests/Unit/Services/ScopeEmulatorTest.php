<?php

/**
 * @file tests/Unit/Services/ScopeEmulatorTest.php
 *
 * @description
 * Unit tests for {@see \Academorix\Scope\Services\ScopeEmulator}
 * — the three emulator methods (`runIn`, `runInNode`, `runInBlank`)
 * with the critical invariant: the previous context is restored
 * on RETURN and on EXCEPTION.
 */

declare(strict_types=1);

use Academorix\Scope\Data\ScopeContextData;
use Academorix\Scope\Services\ScopeContext;
use Academorix\Scope\Services\ScopeEmulator;

uses()->group('unit', 'scope');

function makeCtx(string $tag): ScopeContextData
{
    return new ScopeContextData(
        nodeId: $tag,
        ownerId: 'owner',
        scopeSlug: 'test',
        materialisedPath: "/{$tag}/",
        depth: 0,
    );
}

it('layers the context for the callback duration', function (): void {
    $context = new ScopeContext();
    $emulator = new ScopeEmulator($context);

    $context->set(makeCtx('base'));

    $seenInside = null;
    $emulator->runIn(makeCtx('overlay'), function () use ($context, &$seenInside): void {
        $seenInside = $context->get()?->nodeId;
    });

    expect($seenInside)->toBe('overlay');
});

it('restores the previous context on success', function (): void {
    $context = new ScopeContext();
    $emulator = new ScopeEmulator($context);

    $context->set(makeCtx('base'));

    $emulator->runIn(makeCtx('overlay'), fn () => null);

    // After success, the stack must be back to `base`.
    expect($context->get()?->nodeId)->toBe('base');
});

it('restores the previous context on exception', function (): void {
    $context = new ScopeContext();
    $emulator = new ScopeEmulator($context);

    $context->set(makeCtx('base'));

    try {
        $emulator->runIn(makeCtx('overlay'), function (): void {
            throw new RuntimeException('oops');
        });
    } catch (RuntimeException) {
        // Expected.
    }

    // Critical invariant — even the exception path must pop the
    // pushed context or every subsequent request would run under
    // the overlay.
    expect($context->get()?->nodeId)->toBe('base');
});

it('runInBlank clears the stack and restores it', function (): void {
    $context = new ScopeContext();
    $emulator = new ScopeEmulator($context);

    $context->set(makeCtx('base'));

    $seenInside = 'not-null';
    $emulator->runInBlank(function () use ($context, &$seenInside): void {
        $seenInside = $context->get();
    });

    // Inside the callback — no context.
    expect($seenInside)->toBeNull();
    // Outside — restored.
    expect($context->get()?->nodeId)->toBe('base');
});

it('returns the callback value', function (): void {
    $context = new ScopeContext();
    $emulator = new ScopeEmulator($context);

    $context->set(makeCtx('base'));

    $result = $emulator->runIn(makeCtx('overlay'), fn (): string => 'hello');

    expect($result)->toBe('hello');
});
