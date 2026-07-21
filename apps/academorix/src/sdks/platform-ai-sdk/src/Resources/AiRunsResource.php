<?php

declare(strict_types=1);

namespace Stackra\PlatformAiSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformAiSdk\Data\AiRunData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `ai-runs` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/AiRuns/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category AiSdk
 *
 * @since    0.1.0
 */
final readonly class AiRunsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
