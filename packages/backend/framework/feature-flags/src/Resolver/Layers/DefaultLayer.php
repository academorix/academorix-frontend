<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Resolver\Layers;

use Stackra\FeatureFlags\Resolver\FeatureResolution;
use Stackra\FeatureFlags\Resolver\ResolutionContext;

/**
 * Terminator layer — never returns null.
 *
 * Reads `defaultOff` from the registry definition and returns the
 * inverse as the final decision, with source `default`. This is
 * the layer that fires when every earlier layer deferred, when
 * there is no tenant in context (Requirement 3.8), and when the
 * flag is unknown to the registry (Requirement 3.9 — handled by
 * the checker upstream, but the terminator carries the invariant).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class DefaultLayer implements ResolverLayer
{
    /**
     * {@inheritDoc}
     */
    public function apply(ResolutionContext $context): FeatureResolution
    {
        return $context->definition->defaultOff
            ? FeatureResolution::defaultOff()
            : FeatureResolution::defaultOn();
    }
}
