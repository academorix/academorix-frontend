<?php

declare(strict_types=1);

namespace Stackra\PlatformReportingSdk\Requests\Dashboards;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\PlatformReportingSdk\Data\DashboardData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/dashboards/{dashboard}` — show one Dashboard.
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
final class ShowDashboardRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $dashboard              Path parameter — dashboard.
     */
    public function __construct(
        public readonly string $dashboard,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/dashboards/' . rawurlencode($this->dashboard);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see DashboardData}.
     */
    public function createDtoFromResponse(Response $response): DashboardData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return DashboardData::from($body);
    }
}
