<?php

/**
 * @file tests/Unit/Services/ScopeContextTest.php
 *
 * @description
 * Pure unit tests for {@see \Academorix\Scope\Services\ScopeContext}
 * — the push/pop/get/clear stack semantics that every downstream
 * service relies on. No container, no DB, no Testbench.
 */

declare(strict_types=1);

use Academorix\Scope\Data\ScopeContextData;
use Academorix\Scope\Exceptions\ScopeContextRequiredException;
use Academorix\Scope\Services\ScopeContext;

// Pure-unit tests — override the Testbench default from Pest.php.
uses()->group('unit', 'scope');

/**
 * Build a minimal ScopeContextData for the stack tests. The
 * factory is deliberately terse — these tests care only about
 * identity, not about the semantic content of a context.
 */
function makeContext(string $id): ScopeContextData
{
    return new ScopeContextData(
        nodeId: $id,
        ownerId: 'owner-' . $id,
        scopeSlug: 'team',
        materialisedPath: "/root/{$id}/",
        depth: 1,
    );
}

it('returns null before any context is set', function (): void {
    $context = new ScopeContext();

    expect($context->get())->toBeNull();
});

it('throws from getOrFail when no context is active', function (): void {
    $context = new ScopeContext();

    // The exception name in the message contract lets HTTP
    // wrappers map it cleanly to a 428.
    $context->getOrFail();
})->throws(ScopeContextRequiredException::class);

it('exposes the top of the stack via get()', function (): void {
    $context = new ScopeContext();
    $ctx = makeContext('a');

    $context->set($ctx);

    expect($context->get())->toBe($ctx);
});

it('replaces existing state on set()', function (): void {
    $context = new ScopeContext();
    $first = makeContext('a');
    $second = makeContext('b');

    $context->set($first);
    // Second `set()` — the stack must not accumulate; if it did,
    // a mis-configured Octane worker would leak context between
    // requests.
    $context->set($second);

    expect($context->get())->toBe($second);
});

it('layers push() over set()', function (): void {
    $context = new ScopeContext();
    $base = makeContext('base');
    $overlay = makeContext('overlay');

    $context->set($base);
    $context->push($overlay);

    // Push wins.
    expect($context->get())->toBe($overlay);
});

it('restores the previous top on pop()', function (): void {
    $context = new ScopeContext();
    $base = makeContext('base');
    $overlay = makeContext('overlay');

    $context->set($base);
    $context->push($overlay);
    $context->pop();

    // Pop returns to the previous top.
    expect($context->get())->toBe($base);
});

it('pop() is a safe no-op when the stack is empty', function (): void {
    $context = new ScopeContext();

    // Should not throw — unbalanced pop must never cascade a
    // secondary exception during unwind.
    $context->pop();

    expect($context->get())->toBeNull();
});

it('clear() empties the stack', function (): void {
    $context = new ScopeContext();

    $context->set(makeContext('a'));
    $context->push(makeContext('b'));
    $context->clear();

    expect($context->get())->toBeNull();
});
