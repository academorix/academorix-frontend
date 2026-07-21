<?php

/**
 * @file tests/Unit/Services/ScopeResolverChainTest.php
 *
 * @description
 * Unit tests for {@see \Stackra\Scope\Services\ScopeResolverChain}
 * — priority sorting (descending), name-based replacement,
 * first-non-null-wins short-circuit, and later-registration
 * ties.
 */

declare(strict_types=1);

use Stackra\Scope\Contracts\ScopeResolverInterface;
use Stackra\Scope\Data\ScopeContextData;
use Stackra\Scope\Services\ScopeResolverChain;
use Illuminate\Http\Request;

uses()->group('unit', 'scope');

/**
 * Minimal in-memory resolver — implements the contract without any
 * DB or Request coupling. Tests drive its output via the closure.
 */
function makeResolver(
    string $name,
    int $priority,
    ?ScopeContextData $result = null,
): ScopeResolverInterface {
    return new class ($name, $priority, $result) implements ScopeResolverInterface {
        public function __construct(
            private string $rname,
            private int $rpriority,
            private ?ScopeContextData $rresult,
        ) {}

        public function name(): string
        {
            return $this->rname;
        }

        public function priority(): int
        {
            return $this->rpriority;
        }

        public function resolve(Request $request): ?ScopeContextData
        {
            return $this->rresult;
        }
    };
}

function makeContextData(string $tag): ScopeContextData
{
    return new ScopeContextData(
        nodeId: $tag,
        ownerId: 'owner',
        scopeSlug: 'root',
        materialisedPath: "/{$tag}/",
        depth: 0,
    );
}

it('runs resolvers in descending priority order', function (): void {
    $chain = new ScopeResolverChain();

    // Deliberately register in ascending order — the sort must
    // still produce descending.
    $low = makeResolver('low', 10);
    $mid = makeResolver('mid', 50);
    $high = makeResolver('high', 100);

    $chain->register($low);
    $chain->register($mid);
    $chain->register($high);

    $names = array_map(fn (ScopeResolverInterface $r): string => $r->name(), $chain->all());

    expect($names)->toBe(['high', 'mid', 'low']);
});

it('replaces a resolver with the same name', function (): void {
    $chain = new ScopeResolverChain();

    $first = makeResolver('header', 100);
    $second = makeResolver('header', 200);

    $chain->register($first);
    $chain->register($second);

    // Register-replace by name — the chain should carry only ONE
    // resolver, and it should be the second registration.
    expect($chain->all())->toHaveCount(1);
    expect($chain->all()[0])->toBe($second);
});

it('returns the first non-null result and short-circuits', function (): void {
    $chain = new ScopeResolverChain();

    $expected = makeContextData('winner');

    // Higher-priority resolver misses; middle resolver hits;
    // lower resolver would also hit but must not be called.
    $chain->register(makeResolver('a', 100, null));
    $chain->register(makeResolver('b', 50, $expected));
    $chain->register(makeResolver('c', 0, makeContextData('should-not-see')));

    $actual = $chain->resolve(Request::create('/'));

    expect($actual)->toBe($expected);
});

it('returns null when every resolver defers', function (): void {
    $chain = new ScopeResolverChain();

    $chain->register(makeResolver('a', 100, null));
    $chain->register(makeResolver('b', 50, null));

    expect($chain->resolve(Request::create('/')))->toBeNull();
});

it('breaks priority ties by later registration', function (): void {
    $chain = new ScopeResolverChain();

    $winner = makeContextData('later');

    // Same priority — later registration wins, matching Laravel's
    // route-matcher convention.
    $chain->register(makeResolver('earlier', 100, makeContextData('earlier')));
    $chain->register(makeResolver('later', 100, $winner));

    expect($chain->resolve(Request::create('/'))->nodeId)->toBe('later');
});
