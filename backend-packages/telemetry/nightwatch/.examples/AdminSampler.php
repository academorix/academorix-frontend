<?php

declare(strict_types=1);

namespace App\Nightwatch\Samplers;

use Illuminate\Http\Request;
use Academorix\Nightwatch\Attributes\AsNightwatchSampler;
use Academorix\Nightwatch\Contracts\NightwatchSampler;

/**
 * Example: Admin Sampler.
 *
 * Always samples admin requests for full visibility.
 * Returns null for non-admin requests to defer to default sampling.
 */
#[AsNightwatchSampler(description: 'Always samples admin requests')]
class AdminSampler implements NightwatchSampler
{
    public function shouldSample(Request $request): bool|null
    {
        if ($request->user()?->isAdmin()) {
            return true;
        }

        return null;
    }

    public function priority(): int
    {
        return 100;
    }
}
