<?php

declare(strict_types=1);

namespace App\Nightwatch\Contexts;

use Laravel\Pennant\Feature;
use Stackra\Nightwatch\Attributes\AsNightwatchContext;
use Stackra\Nightwatch\Contracts\NightwatchContext;

/**
 * Example: Feature Flag Context.
 *
 * Tracks which feature flags were active during a request.
 */
#[AsNightwatchContext(description: 'Tracks active feature flags')]
class FeatureFlagContext implements NightwatchContext
{
    public function key(): string
    {
        return 'feature_flags';
    }

    public function data(): array
    {
        return [
            'new_dashboard' => Feature::active('new_dashboard'),
            'enhanced_search' => Feature::active('enhanced_search'),
            'beta_checkout' => Feature::active('beta_checkout'),
        ];
    }

    public function priority(): int
    {
        return 50;
    }
}
