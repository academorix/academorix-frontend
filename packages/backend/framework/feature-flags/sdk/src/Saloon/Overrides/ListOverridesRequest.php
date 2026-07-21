<?php

declare(strict_types=1);

namespace Stackra\FeatureFlagsSdk\Saloon\Overrides;

use Saloon\Enums\Method;
use Saloon\Http\Request;

/**
 * `GET /api/v1/feature-flags/overrides` — paginated list of tenant overrides.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class ListOverridesRequest extends Request
{
    /**
     * HTTP verb.
     *
     * @var Method
     */
    protected Method $method = Method::GET;

    /**
     * Return the request path.
     *
     * @return string
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/feature-flags/overrides';
    }
}
