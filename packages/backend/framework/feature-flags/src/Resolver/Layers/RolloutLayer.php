<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Resolver\Layers;

use Stackra\FeatureFlags\Contracts\Data\FeatureRolloutInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureRolloutRepositoryInterface;
use Stackra\FeatureFlags\Resolver\FeatureResolution;
use Stackra\FeatureFlags\Resolver\ResolutionContext;
use Stackra\FeatureFlags\Support\RolloutHasher;

/**
 * Third layer — decides via the deterministic bucket hash.
 *
 * Walks the caller's `ScopePath` deepest-first, consulting the
 * rollout repository per level. Returns `null` (defer) when no
 * active rollout row applies OR the row's `scope_level` is not
 * on the caller's path (Requirement 13.4). No-tenant contexts
 * short-circuit here and defer to `DefaultLayer` (Requirement 3.8).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class RolloutLayer implements ResolverLayer
{
    /**
     * @param  FeatureRolloutRepositoryInterface  $repository  Rollout persistence boundary.
     */
    public function __construct(
        private readonly FeatureRolloutRepositoryInterface $repository,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function apply(ResolutionContext $context): ?FeatureResolution
    {
        if ($context->tenant === null) {
            return null;
        }

        $sortOrders = $context->scopePath->sortedLevels();
        if ($sortOrders === []) {
            return null;
        }

        // Walk levels deepest-first — a row at a deeper level wins.
        arsort($sortOrders, SORT_NUMERIC);

        foreach (array_keys($sortOrders) as $scopeLevel) {
            $scopeValue = $context->scopePath->valueAt($scopeLevel);
            if ($scopeValue === null) {
                continue;
            }

            $row = $this->repository->findActiveFor($context->flag, $scopeLevel);
            if ($row === null) {
                continue;
            }

            $percentage = (int) $row->getAttribute(FeatureRolloutInterface::ATTR_PERCENTAGE);
            $inBucket   = RolloutHasher::inBucket($context->flag, $scopeValue, $percentage);

            return FeatureResolution::rollout($inBucket);
        }

        return null;
    }
}
