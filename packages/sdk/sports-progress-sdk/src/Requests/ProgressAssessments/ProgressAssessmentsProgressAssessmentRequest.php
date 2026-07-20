<?php

declare(strict_types=1);

namespace Academorix\SportsProgressSdk\Requests\ProgressAssessments;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsProgressSdk\Data\ProgressAssessmentData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `POST /api/v1/athletes/{athlete}/progress-assessments` — custom — custom endpoint (hand-implement).
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
final class ProgressAssessmentsProgressAssessmentRequest extends BaseSdkRequest implements HasBody
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::POST;

    /**
     * @param  string       $athlete                Path parameter — athlete.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly string $athlete,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/athletes/' . rawurlencode($this->athlete) . '/progress-assessments';
    }

    /**
     * Attach the caller-supplied idempotency key when one was provided.
     *
     * @return array<string, string>
     */
    protected function defaultHeaders(): array
    {
        return $this->idempotencyKey !== null
            ? ['Idempotency-Key' => $this->idempotencyKey]
            : [];
    }

    /**
     * Custom endpoint — hand-implement the response shape here.
     *
     * @return mixed
     */
    public function createDtoFromResponse(Response $response): mixed
    {
        // TODO(sdk): hand-implement — this custom endpoint's response
        // shape is not covered by the standard CRUD template. Return
        // the appropriate DTO from src/Data/ once the shape is
        // clarified.
        return $response->json();
    }
}
