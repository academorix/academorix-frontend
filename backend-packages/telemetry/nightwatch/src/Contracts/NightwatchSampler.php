<?php

declare(strict_types=1);

/**
 * Nightwatch Sampler Contract.
 *
 * Samplers determine at runtime whether a given execution context
 * should be sampled by Nightwatch.
 *
 * @category Contracts
 *
 * @since    1.0.0
 */

namespace Academorix\Nightwatch\Contracts;

use Illuminate\Http\Request;

/**
 * Nightwatch Sampler Contract.
 *
 * Samplers determine at runtime whether a given execution context
 * should be sampled by Nightwatch.
 */
interface NightwatchSampler
{
    /**
     * Determine if the request should be sampled.
     *
     * @param Request $request The incoming HTTP request
     *
     * @return bool|null True to force sample, false to force skip, null to defer
     */
    public function shouldSample(Request $request): bool|null;

    /**
     * Priority for execution order. Higher = runs first.
     */
    public function priority(): int;
}
