<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformIntegrationsSdk\Data\AppWebhookSubscriptionData;
use Stackra\PlatformIntegrationsSdk\Requests\AppWebhookSubscriptions\ListAppWebhookSubscriptionsAdminRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `app-webhook-subscriptions` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/AppWebhookSubscriptions/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
final readonly class AppWebhookSubscriptionsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every appwebhooksubscription.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<AppWebhookSubscriptionData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListAppWebhookSubscriptionsAdminRequest($page, $perPage))->dto();
    }
}
