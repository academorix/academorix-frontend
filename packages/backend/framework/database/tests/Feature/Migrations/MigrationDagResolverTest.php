<?php

/**
 * @file packages/backend/framework/database/tests/Feature/Migrations/MigrationDagResolverTest.php
 *
 * @description
 * Pest v4 feature tests for {@see \Stackra\Database\Migrations\MigrationDagResolver}.
 *
 * Every scenario constructs an in-memory {@see DiscoversAttributes}
 * fake, hands it to the resolver, and asserts on the sorted output.
 * No workspace-wide olvlvl manifest is consulted — tests are hermetic.
 *
 * ## Scenarios covered
 *
 *   1. Empty graph  — zero markers → zero output.
 *   2. Linear DAG   — A → B → C emits [A, B, C].
 *   3. Diamond DAG  — A → {B, C} → D emits [A, {B|C}, D].
 *   4. Tiebreaker   — same DAG depth sorts by MIGRATION filename.
 *   5. Missing dep  — #[DependsOn] on a class that doesn't exist
 *                     throws MigrationDependencyMissingException.
 *   6. Cycle        — A → B → A throws MigrationDependencyCycleException.
 *   7. Migration files — resolveMigrationFiles() reads MIGRATION const.
 *   8. Memoisation  — resolve() returns the same list on subsequent calls.
 *
 * @category Database
 *
 * @since    0.2.0
 */

declare(strict_types=1);

use Stackra\Database\Attributes\DependsOn;
use Stackra\Database\Migrations\Exceptions\MigrationDependencyCycleException;
use Stackra\Database\Migrations\Exceptions\MigrationDependencyMissingException;
use Stackra\Database\Migrations\MigrationDagResolver;
use Stackra\Foundation\Contracts\DiscoversAttributes;
use Stackra\Foundation\Discovery\ClassTarget;

// ── Test fixtures ────────────────────────────────────────────────
//
// The resolver uses `class_exists()` to distinguish "this parent
// marker exists but has no #[DependsOn]" from "this parent doesn't
// exist at all". So our fixture markers below MUST be real classes
// declared in this test file. That's fine — they're just typed
// symbols with no runtime behavior.
//
// Naming: `Fixture<Letter>Table` — clear that these are test-only.

final class FixtureATable
{
    public const string MIGRATION = '2026_07_15_120000_create_a_table.php';
    public const string TABLE = 'a';
}

final class FixtureBTable
{
    public const string MIGRATION = '2026_07_15_120001_create_b_table.php';
    public const string TABLE = 'b';
}

final class FixtureCTable
{
    public const string MIGRATION = '2026_07_15_120002_create_c_table.php';
    public const string TABLE = 'c';
}

final class FixtureDTable
{
    public const string MIGRATION = '2026_07_15_120003_create_d_table.php';
    public const string TABLE = 'd';
}

/**
 * An in-memory `DiscoversAttributes` for hermetic tests. Consumers
 * register fake targets via `addClassTarget()`; every other for*()
 * method returns an empty iterable.
 */
final class InMemoryDiscovery implements DiscoversAttributes
{
    /** @var list<ClassTarget<object>> */
    private array $classTargets = [];

    public function addClassTarget(string $className, object $attribute): void
    {
        $this->classTargets[] = new ClassTarget($className, $attribute);
    }

    public function forClass(string $attributeClass): iterable
    {
        foreach ($this->classTargets as $target) {
            if ($target->attribute instanceof $attributeClass) {
                yield $target;
            }
        }
    }

    public function forMethod(string $attributeClass): iterable
    {
        yield from [];
    }

    public function forProperty(string $attributeClass): iterable
    {
        yield from [];
    }

    public function forParameter(string $attributeClass): iterable
    {
        yield from [];
    }
}

// ── Tests ─────────────────────────────────────────────────────────

it('returns an empty list when no markers are discovered', function (): void {
    $resolver = new MigrationDagResolver(new InMemoryDiscovery());
    expect($resolver->resolve())->toBe([]);
});

it('sorts a linear chain A -> B -> C in the correct order', function (): void {
    // Edges: B DependsOn A, C DependsOn B. Expected order: [A, B, C].
    $discovery = new InMemoryDiscovery();
    $discovery->addClassTarget(FixtureBTable::class, new DependsOn(FixtureATable::class));
    $discovery->addClassTarget(FixtureCTable::class, new DependsOn(FixtureBTable::class));

    $resolver = new MigrationDagResolver($discovery);
    $order = $resolver->resolve();

    expect($order)->toBe([
        FixtureATable::class,
        FixtureBTable::class,
        FixtureCTable::class,
    ]);
});

it('sorts a diamond A -> {B, C} -> D with A first and D last', function (): void {
    // A creates first; B and C both depend on A; D depends on B AND C.
    $discovery = new InMemoryDiscovery();
    $discovery->addClassTarget(FixtureBTable::class, new DependsOn(FixtureATable::class));
    $discovery->addClassTarget(FixtureCTable::class, new DependsOn(FixtureATable::class));
    $discovery->addClassTarget(FixtureDTable::class, new DependsOn(FixtureBTable::class));
    $discovery->addClassTarget(FixtureDTable::class, new DependsOn(FixtureCTable::class));

    $resolver = new MigrationDagResolver($discovery);
    $order = $resolver->resolve();

    // A must be first, D must be last. B + C can appear in either
    // order (both have DAG depth 1, tiebroken by MIGRATION filename —
    // B's timestamp is earlier so it wins).
    expect($order[0])->toBe(FixtureATable::class);
    expect($order[3])->toBe(FixtureDTable::class);
    expect([$order[1], $order[2]])->toEqualCanonicalizing([
        FixtureBTable::class,
        FixtureCTable::class,
    ]);
});

it('breaks ties among same-depth markers by MIGRATION filename', function (): void {
    // B and C both have zero parents; both have depth 0 in the DAG.
    // Their filenames differ: B is 120001, C is 120002. Order should
    // put B before C (lexical filename compare).
    $discovery = new InMemoryDiscovery();
    $discovery->addClassTarget(FixtureBTable::class, new DependsOn(FixtureATable::class));
    $discovery->addClassTarget(FixtureCTable::class, new DependsOn(FixtureATable::class));

    $resolver = new MigrationDagResolver($discovery);
    $order = $resolver->resolve();

    // After A, B (120001) sorts before C (120002).
    expect($order)->toBe([
        FixtureATable::class,
        FixtureBTable::class,
        FixtureCTable::class,
    ]);
});

it('throws MigrationDependencyMissingException when a parent marker does not exist', function (): void {
    // Reference a class that isn't defined anywhere — the resolver
    // should surface a MigrationDependencyMissingException before
    // the toposort runs.
    $discovery = new InMemoryDiscovery();
    $discovery->addClassTarget(FixtureBTable::class, new DependsOn('NonexistentClassName123'));

    $resolver = new MigrationDagResolver($discovery);

    expect(fn () => $resolver->resolve())
        ->toThrow(MigrationDependencyMissingException::class);
});

it('throws MigrationDependencyCycleException when the graph has a cycle', function (): void {
    // A DependsOn B, B DependsOn A. Kahn's algorithm exits before
    // visiting either — the resolver throws.
    $discovery = new InMemoryDiscovery();
    $discovery->addClassTarget(FixtureATable::class, new DependsOn(FixtureBTable::class));
    $discovery->addClassTarget(FixtureBTable::class, new DependsOn(FixtureATable::class));

    $resolver = new MigrationDagResolver($discovery);

    expect(fn () => $resolver->resolve())
        ->toThrow(MigrationDependencyCycleException::class);
});

it('resolveMigrationFiles() returns filenames in dependency order', function (): void {
    $discovery = new InMemoryDiscovery();
    $discovery->addClassTarget(FixtureBTable::class, new DependsOn(FixtureATable::class));
    $discovery->addClassTarget(FixtureCTable::class, new DependsOn(FixtureBTable::class));

    $resolver = new MigrationDagResolver($discovery);
    $files = $resolver->resolveMigrationFiles();

    expect($files)->toBe([
        '2026_07_15_120000_create_a_table.php',
        '2026_07_15_120001_create_b_table.php',
        '2026_07_15_120002_create_c_table.php',
    ]);
});

it('memoises the resolved list across resolve() calls', function (): void {
    $discovery = new InMemoryDiscovery();
    $discovery->addClassTarget(FixtureBTable::class, new DependsOn(FixtureATable::class));

    $resolver = new MigrationDagResolver($discovery);

    $first = $resolver->resolve();
    $second = $resolver->resolve();

    expect($first)->toBe($second);
});

it('verify() returns true when the graph is valid', function (): void {
    $discovery = new InMemoryDiscovery();
    $discovery->addClassTarget(FixtureBTable::class, new DependsOn(FixtureATable::class));

    $resolver = new MigrationDagResolver($discovery);

    expect($resolver->verify())->toBeTrue();
});

it('verify() throws when the graph has a cycle', function (): void {
    $discovery = new InMemoryDiscovery();
    $discovery->addClassTarget(FixtureATable::class, new DependsOn(FixtureBTable::class));
    $discovery->addClassTarget(FixtureBTable::class, new DependsOn(FixtureATable::class));

    $resolver = new MigrationDagResolver($discovery);

    expect(fn () => $resolver->verify())
        ->toThrow(MigrationDependencyCycleException::class);
});
