<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Resolver\Layers;

use Academorix\FeatureFlags\Contracts\Repositories\FeatureKillSwitchRepositoryInterface;
use Academorix\FeatureFlags\Resolver\FeatureResolution;
use Academorix\FeatureFlags\Resolver\ResolutionContext;

/**
 * Topmost resolver layer — returns `(false, kill_switch)` when a matching row exists.
 *
 * Wins over every other layer. When no active kill-switch row
 * matches the caller's `ScopePath`, defers by returning `null`
 * (Requirement 3.2, 9.7).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class KillSwitchLayer implements ResolverLayer
{
    /**
     * @param  FeatureKillSwitchRepositoryInterface  $repository  Kill-switch persistence boundary.
     */
    public function __construct(
        private readonly FeatureKillSwitchRepositoryInterface $repository,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function apply(ResolutionContext $context): ?FeatureResolution
    {
        $row = $this->repository->findMatching($context->flag, $context->scopePath);
        if ($row === null) {
            return null;
        }

        return FeatureResolution::killSwitch();
    }
}
