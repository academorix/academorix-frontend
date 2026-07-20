<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Resolver\Layers;

use Academorix\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Academorix\FeatureFlags\Enums\OverrideDecision;
use Academorix\FeatureFlags\Resolver\FeatureResolution;
use Academorix\FeatureFlags\Resolver\ResolutionContext;

/**
 * Second layer — returns the deepest matching `feature_overrides` row's decision.
 *
 * Applies the deepest-wins precedence sort on
 * `scope_definitions.sort_order` (user beats team beats branch
 * beats tenant beats global). No-tenant contexts short-circuit
 * here via the empty `ScopePath` and defer to `DefaultLayer`
 * (Requirement 3.3, 3.8).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class OverrideLayer implements ResolverLayer
{
    /**
     * @param  FeatureOverrideRepositoryInterface  $repository  Override persistence boundary.
     */
    public function __construct(
        private readonly FeatureOverrideRepositoryInterface $repository,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function apply(ResolutionContext $context): ?FeatureResolution
    {
        if ($context->tenant === null) {
            return null;
        }

        $row = $this->repository->findMatching($context->flag, $context->scopePath);
        if ($row === null) {
            return null;
        }

        $decision = $row->getAttribute(FeatureOverrideInterface::ATTR_DECISION);
        $value    = $decision instanceof OverrideDecision
            ? $decision === OverrideDecision::Allow
            : $decision === OverrideDecision::Allow->value;

        return FeatureResolution::override($value);
    }
}
