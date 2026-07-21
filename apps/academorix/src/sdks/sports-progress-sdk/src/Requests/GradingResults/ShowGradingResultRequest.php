<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Requests\GradingResults;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SportsProgressSdk\Data\GradingResultData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/grading-results/{result}` — show one GradingResult.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
final class ShowGradingResultRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $result                 Path parameter — result.
     */
    public function __construct(
        public readonly string $result,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/grading-results/' . rawurlencode($this->result);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see GradingResultData}.
     */
    public function createDtoFromResponse(Response $response): GradingResultData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return GradingResultData::from($body);
    }
}
