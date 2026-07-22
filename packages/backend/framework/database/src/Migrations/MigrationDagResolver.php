<?php

/**
 * @file packages/backend/framework/database/src/Migrations/MigrationDagResolver.php
 *
 * @description
 * Boot-time migration dependency graph resolver — the primary
 * implementation of {@see MigrationDagResolverInterface} authored by
 * ADR-0035.
 *
 * ## What it does
 *
 *   1. Discovers every class carrying `#[DependsOn]` via
 *      `Stackra\Foundation\Contracts\DiscoversAttributes`
 *      (`olvlvl/composer-attribute-collector` at compile time, so
 *      the walk is O(1) at runtime).
 *   2. Builds a directed graph: each discovered marker becomes a
 *      node; each `#[DependsOn]` becomes an edge from PARENT → CHILD.
 *      (Parent must run FIRST — the direction is "produces" not
 *      "requires".)
 *   3. Verifies every parent reference resolves to a discovered
 *      marker; unresolved parent → `MigrationDependencyMissingException`.
 *   4. Runs Kahn's topological sort. Cycles surface as vertices
 *      that never reach in-degree zero →
 *      `MigrationDependencyCycleException`.
 *   5. Sorts markers within the same DAG depth by their `MIGRATION`
 *      filename (which is timestamp-prefixed), so filenames remain a
 *      stable tiebreaker.
 *
 * ## Why Kahn (not DFS)
 *
 * Kahn's algorithm produces a total order in O(V + E) and detects
 * cycles by construction — if the queue empties before every vertex
 * is emitted, the remainder is inside a cycle. DFS-based toposort
 * needs a separate visited/on-stack tracking pass to find cycles;
 * Kahn's is simpler + gives us the cycle vertices for free.
 *
 * ## Memo
 *
 * The resolver caches the sorted result after the first `resolve()`
 * call. Under Octane one `MigrationDagResolver` singleton is created
 * per worker; the memo lives for the worker's lifetime. Attribute
 * discovery is deterministic (compile-time manifest), so cache
 * correctness follows from that + the memo is safe to keep across
 * every request the worker serves.
 *
 * @see \Stackra\Database\Attributes\DependsOn                     Attribute.
 * @see \Stackra\Database\Migrations\Contracts\MigrationDagResolverInterface Contract.
 *
 * @category Database
 *
 * @since    0.2.0
 */

declare(strict_types=1);

namespace Stackra\Database\Migrations;

use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;
use Stackra\Database\Attributes\DependsOn;
use Stackra\Database\Migrations\Contracts\MigrationDagResolverInterface;
use Stackra\Database\Migrations\Exceptions\MigrationDependencyCycleException;
use Stackra\Database\Migrations\Exceptions\MigrationDependencyMissingException;
use Stackra\Foundation\Contracts\DiscoversAttributes;

/**
 * Kahn-toposort-based `#[DependsOn]` resolver.
 *
 * `#[Singleton]` — the graph is a deterministic function of the
 * compile-time attribute manifest; every worker resolves the same
 * order.
 *
 * `#[Bind]` on the concrete class — routes container resolves of
 * `MigrationDagResolverInterface` to this implementation. Tests can
 * swap by binding the interface directly.
 */
#[Bind(MigrationDagResolverInterface::class)]
#[Singleton]
final class MigrationDagResolver implements MigrationDagResolverInterface
{
    /**
     * Cached sorted list of marker FQCNs. Populated on first
     * `resolve()` call; kept for the worker's lifetime.
     *
     * @var list<class-string>|null
     */
    private ?array $sortedMarkers = null;

    /**
     * @param  DiscoversAttributes  $discovery  The compile-time attribute
     *                                          discovery seam. Injected via
     *                                          the container.
     */
    public function __construct(
        private readonly DiscoversAttributes $discovery,
    ) {}

    /**
     * {@inheritDoc}
     *
     * Kahn's algorithm — build the adjacency list, iterate the queue
     * of vertices with in-degree zero, decrement neighbours' in-
     * degrees, repeat. When the queue empties, if any vertex still
     * has non-zero in-degree, the remainder participates in a cycle.
     */
    public function resolve(): array
    {
        if ($this->sortedMarkers !== null) {
            return $this->sortedMarkers;
        }

        // ── Step 1: walk every `#[DependsOn]` hit.
        //
        // `forClass(DependsOn::class)` yields ONE ClassTarget per
        // (marker × #[DependsOn]) pair — repeatable attribute means a
        // marker with 3 parents shows up 3 times. We accumulate the
        // parent list per marker + track every discovered marker.
        /** @var array<class-string, list<class-string>> $parents */
        $parents = [];

        // Every marker we've SEEN (either as a `forClass` hit OR as a
        // parent referenced by another marker's `#[DependsOn]`). We
        // check discoveredMarkers vs referencedMarkers at the end to
        // report missing-parent violations.
        /** @var array<class-string, true> $discoveredMarkers */
        $discoveredMarkers = [];

        foreach ($this->discovery->forClass(DependsOn::class) as $target) {
            /** @var class-string $childMarker */
            $childMarker = $target->className;
            /** @var DependsOn $attribute */
            $attribute = $target->attribute;

            $discoveredMarkers[$childMarker] = true;
            $parents[$childMarker] ??= [];
            $parents[$childMarker][] = $attribute->parentMarker;
        }

        // A marker without any `#[DependsOn]` still needs to appear in
        // the graph — it has zero parents but MAY be referenced as a
        // parent by others. `discoveredMarkers` above only lists
        // markers with AT LEAST ONE `#[DependsOn]`. Parent-only
        // markers (e.g. `TenantsTable`) get added below when we scan
        // parent references.
        $referencedParents = [];
        foreach ($parents as $ps) {
            foreach ($ps as $p) {
                $referencedParents[$p] = true;
            }
        }

        // Missing-parent check: every referenced parent MUST be a
        // discovered marker OR itself a discoverable class. Since a
        // parent that carries NO `#[DependsOn]` is legitimate but not
        // discovered above, we can't use `discoveredMarkers` alone as
        // the truth set. Instead we probe class existence: if the FQCN
        // doesn't exist as a loadable class, it's a missing parent.
        foreach ($parents as $child => $childParents) {
            foreach ($childParents as $parent) {
                if (! \class_exists($parent)) {
                    throw MigrationDependencyMissingException::of($child, $parent);
                }
            }
        }

        // ── Step 2: assemble every node in the graph.
        //
        // Nodes = discovered markers ∪ referenced parents. In-degree
        // for a node is the number of `#[DependsOn]` attributes on it.
        /** @var array<class-string, int> $inDegree */
        $inDegree = [];
        foreach (\array_keys($discoveredMarkers) as $marker) {
            $inDegree[$marker] = \count($parents[$marker] ?? []);
        }
        foreach (\array_keys($referencedParents) as $marker) {
            $inDegree[$marker] ??= 0; // parent-only, no incoming edges
        }

        // ── Step 3: adjacency — parent -> [children].
        //
        // The kahn queue processes parents first; we need to be able
        // to say "which children does this parent unblock when it's
        // consumed?". Invert the parents map to build a children map.
        /** @var array<class-string, list<class-string>> $children */
        $children = [];
        foreach ($parents as $child => $childParents) {
            foreach ($childParents as $parent) {
                $children[$parent] ??= [];
                $children[$parent][] = $child;
            }
        }

        // ── Step 4: seed the queue with every in-degree-zero node.
        //
        // Order matters for the tiebreaker — sort the seed alphabetically
        // by class name so the initial output is deterministic. Within
        // the loop, when multiple ready nodes emerge, tie-break by
        // MIGRATION filename (timestamp-prefixed) so filename ordering
        // remains a stable secondary sort.
        $readyQueue = [];
        foreach ($inDegree as $marker => $degree) {
            if ($degree === 0) {
                $readyQueue[] = $marker;
            }
        }
        $this->sortQueueByMigrationTimestamp($readyQueue);

        // ── Step 5: drain the queue in FIFO order.
        $sorted = [];
        while ($readyQueue !== []) {
            $marker = \array_shift($readyQueue);
            $sorted[] = $marker;

            $newlyReady = [];
            foreach ($children[$marker] ?? [] as $child) {
                $inDegree[$child]--;
                if ($inDegree[$child] === 0) {
                    $newlyReady[] = $child;
                }
            }

            // Sort the newly-ready batch by MIGRATION filename before
            // appending — that keeps timestamps as a stable tiebreaker.
            if ($newlyReady !== []) {
                $this->sortQueueByMigrationTimestamp($newlyReady);
                foreach ($newlyReady as $r) {
                    $readyQueue[] = $r;
                }
            }
        }

        // ── Step 6: cycle detection.
        //
        // If the sort didn't visit every node, the remaining nodes
        // participate in a cycle. We surface all of them so operators
        // can inspect the sub-graph + fix the offending edge.
        if (\count($sorted) !== \count($inDegree)) {
            $inCycle = [];
            foreach ($inDegree as $marker => $degree) {
                if ($degree > 0) {
                    $inCycle[] = $marker;
                }
            }
            throw MigrationDependencyCycleException::of($inCycle);
        }

        $this->sortedMarkers = $sorted;
        return $sorted;
    }

    /**
     * {@inheritDoc}
     */
    public function resolveMigrationFiles(): array
    {
        $files = [];
        foreach ($this->resolve() as $marker) {
            // Read the marker's MIGRATION constant. Every marker
            // authored per ADR-0035 §D1 declares this constant; if
            // it's missing we skip the marker (parent-only markers
            // that no migration produces don't have a MIGRATION const
            // — that's legitimate for logical grouping markers).
            if (! \defined($marker . '::MIGRATION')) {
                continue;
            }
            $migration = (string) \constant($marker . '::MIGRATION');
            if ($migration !== '') {
                $files[] = $migration;
            }
        }
        return $files;
    }

    /**
     * {@inheritDoc}
     */
    public function verify(): bool
    {
        $this->resolve();
        return true;
    }

    /**
     * Sort a batch of marker FQCNs by their `MIGRATION` constant
     * (timestamp-prefixed filename). Markers without a MIGRATION
     * const sort by FQCN alphabetically as a fallback.
     *
     * Sort is in-place — takes the array by reference.
     *
     * @param  list<class-string>  $batch  In-place sorted marker list.
     */
    private function sortQueueByMigrationTimestamp(array &$batch): void
    {
        \usort($batch, function (string $a, string $b): int {
            $ma = \defined($a . '::MIGRATION') ? (string) \constant($a . '::MIGRATION') : $a;
            $mb = \defined($b . '::MIGRATION') ? (string) \constant($b . '::MIGRATION') : $b;
            return \strcmp($ma, $mb);
        });
    }
}
