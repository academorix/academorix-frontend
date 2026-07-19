<?php

declare(strict_types=1);

namespace Academorix\SportsDevelopmentSdk\Requests\Goals;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsDevelopmentSdk\Data\GoalData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/athletes/{athlete}/goals` — custom — custom endpoint (hand-implement).
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
final class GoalsGoalRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $athlete                Path parameter — athlete.
     */
    public function __construct(
        public readonly string $athlete,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/athletes/' . rawurlencode($this->athlete) . '/goals';
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
