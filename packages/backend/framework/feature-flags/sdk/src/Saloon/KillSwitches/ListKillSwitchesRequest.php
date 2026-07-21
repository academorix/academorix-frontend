<?php

declare(strict_types=1);

namespace Stackra\FeatureFlagsSdk\Saloon\KillSwitches;

use Saloon\Enums\Method;
use Saloon\Http\Request;

/**
 * `GET /api/v1/feature-flags/kill-switches` — paginated list.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class ListKillSwitchesRequest extends Request
{
    /**
     * HTTP verb.
     *
     * @var Method
     */
    protected Method $method = Method::GET;

    /**
     * Return the request path relative to the connector base URL.
     *
     * @return string
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/feature-flags/kill-switches';
    }
}
