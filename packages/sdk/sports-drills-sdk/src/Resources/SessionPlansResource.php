<?php

declare(strict_types=1);

namespace Academorix\SportsDrillsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsDrillsSdk\Data\SessionPlanData;
use Academorix\SportsDrillsSdk\Requests\SessionPlans\CreateSessionPlanRequest;
use Academorix\SportsDrillsSdk\Requests\SessionPlans\ListSessionPlansRequest;
use Academorix\SportsDrillsSdk\Requests\SessionPlans\ShowSessionPlanRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `session-plans` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/SessionPlans/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
final readonly class SessionPlansResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every sessionplan.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<SessionPlanData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListSessionPlansRequest($page, $perPage))->dto();
    }


    /**
     * Create a sessionplan.
     *
     * @param  CreateSessionPlanPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return SessionPlanData
     */
    public function create(\Academorix\SportsDrillsSdk\Payloads\SessionPlans\CreateSessionPlanPayload $payload, ?string $idempotencyKey = null): SessionPlanData
    {
        return $this->connector->send(new CreateSessionPlanRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one sessionplan.
     *
     * @param  string  $plan                   Path parameter — plan.
     *
     * @return SessionPlanData
     */
    public function show(string $plan): SessionPlanData
    {
        return $this->connector->send(new ShowSessionPlanRequest($plan))->dto();
    }
}
