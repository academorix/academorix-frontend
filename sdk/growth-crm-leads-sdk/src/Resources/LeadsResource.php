<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\GrowthCrmLeadsSdk\Data\LeadData;
use Academorix\GrowthCrmLeadsSdk\Requests\Leads\CreateLeadRequest;
use Academorix\GrowthCrmLeadsSdk\Requests\Leads\ListLeadsRequest;
use Academorix\GrowthCrmLeadsSdk\Requests\Leads\ShowLeadRequest;
use Academorix\GrowthCrmLeadsSdk\Requests\Leads\UpdateLeadRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `leads` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Leads/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
final readonly class LeadsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every lead.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<LeadData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListLeadsRequest($page, $perPage))->dto();
    }


    /**
     * Create a lead.
     *
     * @param  CreateLeadPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return LeadData
     */
    public function create(\Academorix\GrowthCrmLeadsSdk\Payloads\Leads\CreateLeadPayload $payload, ?string $idempotencyKey = null): LeadData
    {
        return $this->connector->send(new CreateLeadRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one lead.
     *
     * @param  string  $lead                   Path parameter — lead.
     *
     * @return LeadData
     */
    public function show(string $lead): LeadData
    {
        return $this->connector->send(new ShowLeadRequest($lead))->dto();
    }


    /**
     * Update one lead.
     *
     * @param  string  $lead                   Path parameter — lead.
     * @param  UpdateLeadPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return LeadData
     */
    public function update(string $lead, \Academorix\GrowthCrmLeadsSdk\Payloads\Leads\UpdateLeadPayload $payload, ?string $idempotencyKey = null): LeadData
    {
        return $this->connector->send(new UpdateLeadRequest($lead, $payload, $idempotencyKey))->dto();
    }
}
