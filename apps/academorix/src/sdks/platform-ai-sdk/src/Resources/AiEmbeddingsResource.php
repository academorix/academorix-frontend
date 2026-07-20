<?php

declare(strict_types=1);

namespace Academorix\PlatformAiSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformAiSdk\Data\AiEmbeddingData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `ai-embeddings` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/AiEmbeddings/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category AiSdk
 *
 * @since    0.1.0
 */
final readonly class AiEmbeddingsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
