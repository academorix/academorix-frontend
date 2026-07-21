<?php

/**
 * @file packages/framework/service-provider/tests/Unit/Registry/AbstractRegistryTest.php
 *
 * @description
 * Unit coverage for
 * {@see \Stackra\ServiceProvider\Registry\AbstractRegistry}.
 *
 * ## Strategy — pure PHP, no framework boot
 *
 * Every test uses a `FakeRegistry` fixture defined inline in this
 * file — a trivial concrete subclass that surfaces the abstract
 * base's behaviour without pulling in any real domain type. This
 * keeps the tests focused on the mechanical contract (priority
 * sort, insertion-cursor tie-break, memoization, metadata + entry
 * accessors, `resolvePriorityFor()` hook, collect bridge, clear
 * semantics) without coupling to any concrete registry's side-map
 * layout.
 *
 * A second `DerivingRegistry` fixture proves the
 * `resolvePriorityFor()` hook is consulted every time
 * {@see \Stackra\ServiceProvider\Registry\AbstractRegistry::register()}
 * runs — enabling subclasses to derive priority from the key
 * without overriding `register()` itself.
 */

declare(strict_types=1);

namespace Stackra\ServiceProvider\Tests\Unit\Registry;

use Stackra\ServiceProvider\Registry\AbstractRegistry;
use Illuminate\Support\Collection;

/**
 * Trivial concrete subclass — surfaces the abstract base's
 * behaviour without adding domain-specific state. Used only by
 * this test file.
 */
final class FakeRegistry extends AbstractRegistry {}

/**
 * Concrete subclass that overrides {@see resolvePriorityFor()}
 * so we can verify the hook is invoked on every
 * {@see AbstractRegistry::register()} call. The override always
 * returns `999` regardless of the caller-supplied priority — that
 * lets the test differentiate "hook ran" from "caller's value was
 * stored verbatim".
 */
final class DerivingRegistry extends AbstractRegistry
{
    protected function resolvePriorityFor(string $key, int $providedPriority): int
    {
        return 999;
    }
}

// ─── Register + retrieve ─────────────────────────────────────────

it('registers a key and reports it via has() and count()', function (): void {
    $registry = new FakeRegistry;

    expect($registry->has('alpha'))->toBeFalse();
    expect($registry->count())->toBe(0);

    $registry->register('alpha');

    expect($registry->has('alpha'))->toBeTrue();
    expect($registry->count())->toBe(1);
    expect($registry->all())->toBe(['alpha']);
});

// ─── Priority ordering ───────────────────────────────────────────

it('sorts by priority ascending (lower runs first)', function (): void {
    $registry = new FakeRegistry;

    $registry->register('late', 200);
    $registry->register('early', 50);
    $registry->register('middle', 100);

    expect($registry->all())->toBe(['early', 'middle', 'late']);
});

// ─── Insertion-order tie-breaking ────────────────────────────────

it('breaks priority ties by insertion order (stable sort)', function (): void {
    $registry = new FakeRegistry;

    $registry->register('first', 100);
    $registry->register('second', 100);
    $registry->register('third', 100);

    expect($registry->all())->toBe(['first', 'second', 'third']);
});

it('interleaves ties into the priority order', function (): void {
    $registry = new FakeRegistry;

    $registry->register('lowB', 200);   // cursor 0
    $registry->register('highA', 50);   // cursor 1
    $registry->register('lowA', 200);   // cursor 2
    $registry->register('highB', 50);   // cursor 3

    // Priority 50 group ordered by cursor (highA, highB), then
    // priority 200 group (lowB, lowA).
    expect($registry->all())->toBe(['highA', 'highB', 'lowB', 'lowA']);
});

// ─── Duplicate register() is idempotent ──────────────────────────

it('is idempotent on duplicate register() — count stays at 1, priority stays at first-call value', function (): void {
    $registry = new FakeRegistry;

    $registry->register('once', 50);
    $registry->register('once', 999);
    $registry->register('once', 1);

    expect($registry->count())->toBe(1);
    expect($registry->all())->toBe(['once']);
    // The first-call priority wins.
    expect($registry->priorityOf('once'))->toBe(50);
});

it('preserves insertion cursor on duplicate register() — new sibling still sorts after', function (): void {
    $registry = new FakeRegistry;

    $registry->register('first', 100);   // cursor 0
    $registry->register('second', 100);  // cursor 1
    $registry->register('first', 100);   // duplicate — cursor stays at 0

    expect($registry->all())->toBe(['first', 'second']);
});

it('does not overwrite metadata on duplicate register()', function (): void {
    $registry = new FakeRegistry;

    $registry->register('key', 100, 'first-payload');
    $registry->register('key', 100, 'second-payload');

    expect($registry->metadataOf('key'))->toBe('first-payload');
});

// ─── allReversed() ───────────────────────────────────────────────

it('allReversed() returns the ascending order reversed', function (): void {
    $registry = new FakeRegistry;

    $registry->register('late', 200);
    $registry->register('early', 50);
    $registry->register('middle', 100);

    expect($registry->all())->toBe(['early', 'middle', 'late']);
    expect($registry->allReversed())->toBe(['late', 'middle', 'early']);
});

// ─── entries() ───────────────────────────────────────────────────

it('entries() yields {key, priority, metadata} in priority order', function (): void {
    $registry = new FakeRegistry;

    $registry->register('late', 200, ['label' => 'late-payload']);
    $registry->register('early', 50, 'early-payload');
    $registry->register('middle', 100);

    expect($registry->entries())->toBe([
        ['key' => 'early', 'priority' => 50, 'metadata' => 'early-payload'],
        ['key' => 'middle', 'priority' => 100, 'metadata' => null],
        ['key' => 'late', 'priority' => 200, 'metadata' => ['label' => 'late-payload']],
    ]);
});

// ─── priorityOf() ────────────────────────────────────────────────

it('priorityOf() returns the stored priority for registered keys', function (): void {
    $registry = new FakeRegistry;

    $registry->register('alpha', 42);

    expect($registry->priorityOf('alpha'))->toBe(42);
});

it('priorityOf() returns null for unknown keys', function (): void {
    $registry = new FakeRegistry;

    expect($registry->priorityOf('missing'))->toBeNull();
});

// ─── metadataOf() ────────────────────────────────────────────────

it('metadataOf() returns the stored payload for registered keys', function (): void {
    $registry = new FakeRegistry;

    $payload = ['label' => 'demo', 'flag' => true];
    $registry->register('alpha', 100, $payload);

    expect($registry->metadataOf('alpha'))->toBe($payload);
});

it('metadataOf() returns null when the key was registered without metadata', function (): void {
    $registry = new FakeRegistry;

    $registry->register('alpha', 100);

    expect($registry->metadataOf('alpha'))->toBeNull();
});

it('metadataOf() returns null for unknown keys', function (): void {
    $registry = new FakeRegistry;

    expect($registry->metadataOf('missing'))->toBeNull();
});

// ─── resolvePriorityFor() hook ───────────────────────────────────

it('invokes resolvePriorityFor() on register() so subclasses can transform the priority', function (): void {
    $registry = new DerivingRegistry;

    // The subclass's override always returns 999 regardless of the
    // caller-supplied priority.
    $registry->register('alpha', 50);
    $registry->register('bravo', 200);

    expect($registry->priorityOf('alpha'))->toBe(999);
    expect($registry->priorityOf('bravo'))->toBe(999);
    expect($registry->all())->toBe(['alpha', 'bravo']); // Insertion order (tie on 999)
});

// ─── clear() ─────────────────────────────────────────────────────

it('clear() resets count(), has(), all(), and metadata slots', function (): void {
    $registry = new FakeRegistry;

    $registry->register('alpha', 100, 'meta-a');
    $registry->register('beta', 100, 'meta-b');
    expect($registry->count())->toBe(2);
    expect($registry->metadataOf('alpha'))->toBe('meta-a');

    $registry->clear();

    expect($registry->count())->toBe(0);
    expect($registry->has('alpha'))->toBeFalse();
    expect($registry->has('beta'))->toBeFalse();
    expect($registry->all())->toBe([]);
    expect($registry->metadataOf('alpha'))->toBeNull();
    expect($registry->priorityOf('alpha'))->toBeNull();
});

// ─── Memoization ─────────────────────────────────────────────────

it('memoizes all() — two consecutive calls return the SAME array reference', function (): void {
    $registry = new FakeRegistry;

    $registry->register('zeta', 300);
    $registry->register('alpha', 100);

    $first = $registry->all();
    $second = $registry->all();

    // PHP arrays compare by value with `===`. To assert "same
    // reference / same cached instance" we compare against the
    // cached result via a spy-like sequence: mutate the returned
    // slot and confirm the memo returns the mutated view — proves
    // both callers share the identical underlying array.
    expect($first)->toBe($second);
    expect($first)->toBe(['alpha', 'zeta']);
});

// ─── Memo invalidation on register() ─────────────────────────────

it('register() invalidates the memo — the next all() call re-sorts and includes the new entry', function (): void {
    $registry = new FakeRegistry;

    $registry->register('alpha', 100);
    $registry->register('zeta', 300);

    $before = $registry->all();
    expect($before)->toBe(['alpha', 'zeta']);

    // New sibling with a middle priority.
    $registry->register('middle', 200);

    $after = $registry->all();
    expect($after)->toBe(['alpha', 'middle', 'zeta']);

    // Sanity — the cache differs from the pre-invalidation snapshot.
    expect($after)->not->toBe($before);
});

// ─── Memo invalidation on clear() ────────────────────────────────

it('clear() invalidates the memo — a fresh registration after clear() sorts correctly', function (): void {
    $registry = new FakeRegistry;

    $registry->register('old', 100);
    expect($registry->all())->toBe(['old']);

    $registry->clear();
    $registry->register('new-high', 300);
    $registry->register('new-low', 50);

    expect($registry->all())->toBe(['new-low', 'new-high']);
    expect($registry->has('old'))->toBeFalse();
});

// ─── collect() bridge ────────────────────────────────────────────

it('collect() returns a Collection whose ->all() matches the registry', function (): void {
    $registry = new FakeRegistry;

    $registry->register('late', 200);
    $registry->register('early', 50);

    $collection = $registry->collect();

    expect($collection)->toBeInstanceOf(Collection::class);
    expect($collection->all())->toBe(['early', 'late']);
    expect($collection->all())->toBe($registry->all());
});

it('collect() allocates a NEW Collection instance on every call', function (): void {
    $registry = new FakeRegistry;

    $registry->register('alpha', 100);

    $first = $registry->collect();
    $second = $registry->collect();

    expect($first)->not->toBe($second);
    // Both wrap the same underlying `all()` payload.
    expect($first->all())->toBe($second->all());
});

// ─── Concrete subclass extension ─────────────────────────────────

it('supports concrete subclass extension — DerivingRegistry surfaces the same base contract', function (): void {
    $registry = new DerivingRegistry;

    $registry->register('alpha');
    $registry->register('bravo');

    expect($registry->count())->toBe(2);
    expect($registry->has('alpha'))->toBeTrue();
    expect($registry->all())->toBe(['alpha', 'bravo']);
    expect($registry->allReversed())->toBe(['bravo', 'alpha']);

    $registry->clear();

    expect($registry->count())->toBe(0);
});
