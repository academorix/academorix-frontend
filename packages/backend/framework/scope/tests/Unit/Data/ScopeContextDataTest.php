<?php

/**
 * @file tests/Unit/Data/ScopeContextDataTest.php
 *
 * @description
 * Unit tests for {@see \Stackra\Scope\Data\ScopeContextData}
 * — the readonly value object every downstream service reads.
 * Focus: ancestor-id parsing (the hot-path helper the resolver
 * relies on).
 */

declare(strict_types=1);

use Stackra\Scope\Data\ScopeContextData;

uses()->group('unit', 'scope');

it('parses ancestorIds from the materialised path', function (): void {
    $ctx = new ScopeContextData(
        nodeId: 'leaf',
        ownerId: 'owner',
        scopeSlug: 'team',
        materialisedPath: '/root/branch/leaf/',
        depth: 2,
    );

    // Root first, self last. Empty strings from split are dropped.
    expect($ctx->ancestorIds())->toBe(['root', 'branch', 'leaf']);
});

it('returns empty ancestors for a fresh root with just its own id', function (): void {
    $ctx = new ScopeContextData(
        nodeId: 'root',
        ownerId: 'owner',
        scopeSlug: 'owner',
        materialisedPath: '/root/',
        depth: 0,
    );

    expect($ctx->ancestorIds())->toBe(['root']);
});

it('is immutable (readonly)', function (): void {
    $ctx = new ScopeContextData(
        nodeId: 'a',
        ownerId: 'owner',
        scopeSlug: 'team',
        materialisedPath: '/a/',
        depth: 0,
    );

    // Attempt to mutate — must throw a readonly error.
    $ctx->nodeId = 'b'; // @phpstan-ignore-line
})->throws(Error::class);
