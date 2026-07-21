<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Resolver\Layers;

use Stackra\FeatureFlags\Resolver\FeatureResolution;
use Stackra\FeatureFlags\Resolver\ResolutionContext;

/**
 * Contract every resolver-chain layer implements.
 *
 * `FeatureResolver` composes five implementations in fixed order —
 * `KillSwitch → Override → Rollout → PlanGate → Default` — and
 * walks them until one returns a non-null decision. Every layer
 * either returns a `FeatureResolution` (its verdict) or `null`
 * (defer to the next layer). The terminal `DefaultLayer` never
 * returns `null`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
interface ResolverLayer
{
    /**
     * Apply this layer's logic to the evaluation context.
     *
     * @param  ResolutionContext  $context  Frozen inputs for this evaluation.
     * @return FeatureResolution|null       This layer's decision, or null to defer.
     */
    public function apply(ResolutionContext $context): ?FeatureResolution;
}
