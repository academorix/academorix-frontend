<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Requests\ProgressAssessments;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SportsProgressSdk\Data\ProgressAssessmentData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/progress-assessments/{assessment}` — show one ProgressAssessment.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
final class ShowProgressAssessmentRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $assessment             Path parameter — assessment.
     */
    public function __construct(
        public readonly string $assessment,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/progress-assessments/' . rawurlencode($this->assessment);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see ProgressAssessmentData}.
     */
    public function createDtoFromResponse(Response $response): ProgressAssessmentData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return ProgressAssessmentData::from($body);
    }
}
