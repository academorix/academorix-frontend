<?php

/**
 * @file src/Services/ScopeResolverChain.php
 *
 * @description
 * Concrete implementation of {@see ScopeResolverChainInterface}.
 * Holds the ordered list of resolvers, applies priority sorting,
 * and iterates until a resolver hands back a non-null context.
 * Registration replaces by resolver `name()` so a consumer can
 * override a shipped resolver without touching this class.
 */

declare(strict_types=1);

namespace Academorix\Scope\Services;

use Academorix\Scope\Contracts\ScopeResolverChainInterface;
use Academorix\Scope\Contracts\ScopeResolverInterface;
use Academorix\Scope\Data\ScopeContextData;
use Illuminate\Http\Request;

/**
 * Priority-sorted resolver chain.
 *
 * ## Sort stability
 *
 * PHP's `usort` is not stable — equal-priority resolvers can
 * swap. We compensate with a monotonic registration counter and
 * secondary tiebreaker on that counter (LATER registrations win
 * for ties, matching how Laravel's route matcher favours the last
 * registered route on a tie).
 */
final class ScopeResolverChain implements ScopeResolverChainInterface
{
    /**
     * Registered resolvers, keyed by `name()` so registration
     * replaces cleanly.
     *
     * @var array<string, ScopeResolverInterface>
     */
    private array $resolvers = [];

    /**
     * Registration order counter — the tiebreaker when two
     * resolvers share a priority.
     *
     * @var array<string, int>
     */
    private array $order = [];

    private int $counter = 0;

    public function register(ScopeResolverInterface $resolver): void
    {
        $name = $resolver->name();

        $this->resolvers[$name] = $resolver;
        // Later registrations win ties — bump the counter every time
        // so the newest gets the highest tiebreaker value.
        $this->order[$name] = ++$this->counter;
    }

    public function resolve(Request $request): ?ScopeContextData
    {
        foreach ($this->sorted() as $resolver) {
            $context = $resolver->resolve($request);

            if ($context !== null) {
                return $context;
            }
        }

        return null;
    }

    public function all(): array
    {
        return $this->sorted();
    }

    /**
     * @return list<ScopeResolverInterface>
     */
    private function sorted(): array
    {
        $names = array_keys($this->resolvers);

        // Descending by priority; ties broken by later registration.
        usort(
            $names,
            function (string $a, string $b): int {
                $priorityDiff = $this->resolvers[$b]->priority() <=> $this->resolvers[$a]->priority();

                if ($priorityDiff !== 0) {
                    return $priorityDiff;
                }

                return $this->order[$b] <=> $this->order[$a];
            },
        );

        return array_map(
            fn (string $name): ScopeResolverInterface => $this->resolvers[$name],
            $names,
        );
    }
}
