<?php

declare(strict_types=1);

namespace Stackra\SportsDevelopmentSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsDevelopmentSdk\Data\GoalData;
use Stackra\SportsDevelopmentSdk\Requests\Goals\CreateGoalRequest;
use Stackra\SportsDevelopmentSdk\Requests\Goals\GoalsGoalRequest;
use Stackra\SportsDevelopmentSdk\Requests\Goals\UpdateGoalRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `goals` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Goals/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
final readonly class GoalsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * Custom — custom endpoint (hand-implement).
     *
     * @param  string  $athlete                Path parameter — athlete.
     *
     * @return mixed
     */
    public function goals(string $athlete): mixed
    {
        return $this->connector->send(new GoalsGoalRequest($athlete))->dto();
    }


    /**
     * Create a goal.
     *
     * @param  CreateGoalPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return GoalData
     */
    public function create(\Stackra\SportsDevelopmentSdk\Payloads\Goals\CreateGoalPayload $payload, ?string $idempotencyKey = null): GoalData
    {
        return $this->connector->send(new CreateGoalRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Update one goal.
     *
     * @param  string  $goal                   Path parameter — goal.
     * @param  UpdateGoalPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return GoalData
     */
    public function update(string $goal, \Stackra\SportsDevelopmentSdk\Payloads\Goals\UpdateGoalPayload $payload, ?string $idempotencyKey = null): GoalData
    {
        return $this->connector->send(new UpdateGoalRequest($goal, $payload, $idempotencyKey))->dto();
    }
}
