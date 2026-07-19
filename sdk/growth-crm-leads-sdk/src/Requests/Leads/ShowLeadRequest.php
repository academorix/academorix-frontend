<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Requests\Leads;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\GrowthCrmLeadsSdk\Data\LeadData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/leads/{lead}` — show one Lead.
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
final class ShowLeadRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $lead                   Path parameter — lead.
     */
    public function __construct(
        public readonly string $lead,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/leads/' . rawurlencode($this->lead);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see LeadData}.
     */
    public function createDtoFromResponse(Response $response): LeadData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return LeadData::from($body);
    }
}
