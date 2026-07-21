<?php

declare(strict_types=1);

namespace Stackra\SportsDrillsSdk\Requests\SessionPlans;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SportsDrillsSdk\Data\SessionPlanData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/session-plans/{plan}` — show one SessionPlan.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
final class ShowSessionPlanRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $plan                   Path parameter — plan.
     */
    public function __construct(
        public readonly string $plan,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/session-plans/' . rawurlencode($this->plan);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see SessionPlanData}.
     */
    public function createDtoFromResponse(Response $response): SessionPlanData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return SessionPlanData::from($body);
    }
}
