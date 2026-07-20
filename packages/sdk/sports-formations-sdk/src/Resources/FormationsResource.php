<?php

declare(strict_types=1);

namespace Academorix\SportsFormationsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsFormationsSdk\Data\FormationData;
use Academorix\SportsFormationsSdk\Requests\Formations\CreateFormationRequest;
use Academorix\SportsFormationsSdk\Requests\Formations\ListFormationsRequest;
use Academorix\SportsFormationsSdk\Requests\Formations\ShowFormationRequest;
use Academorix\SportsFormationsSdk\Requests\Formations\UpdateFormationRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `formations` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Formations/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category FormationsSdk
 *
 * @since    0.1.0
 */
final readonly class FormationsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every formation.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<FormationData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListFormationsRequest($page, $perPage))->dto();
    }


    /**
     * Create a formation.
     *
     * @param  CreateFormationPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return FormationData
     */
    public function create(\Academorix\SportsFormationsSdk\Payloads\Formations\CreateFormationPayload $payload, ?string $idempotencyKey = null): FormationData
    {
        return $this->connector->send(new CreateFormationRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one formation.
     *
     * @param  string  $formation              Path parameter — formation.
     *
     * @return FormationData
     */
    public function show(string $formation): FormationData
    {
        return $this->connector->send(new ShowFormationRequest($formation))->dto();
    }


    /**
     * Update one formation.
     *
     * @param  string  $formation              Path parameter — formation.
     * @param  UpdateFormationPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return FormationData
     */
    public function update(string $formation, \Academorix\SportsFormationsSdk\Payloads\Formations\UpdateFormationPayload $payload, ?string $idempotencyKey = null): FormationData
    {
        return $this->connector->send(new UpdateFormationRequest($formation, $payload, $idempotencyKey))->dto();
    }
}
