<?php

declare(strict_types=1);

namespace Academorix\PlatformPublicSiteSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformPublicSiteSdk\Data\PublicPageData;
use Academorix\PlatformPublicSiteSdk\Requests\PublicPages\CreatePublicPageRequest;
use Academorix\PlatformPublicSiteSdk\Requests\PublicPages\ListPublicPagesRequest;
use Academorix\PlatformPublicSiteSdk\Requests\PublicPages\ShowPublicPageRequest;
use Academorix\PlatformPublicSiteSdk\Requests\PublicPages\UpdatePublicPageRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `public-pages` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/PublicPages/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category PublicSiteSdk
 *
 * @since    0.1.0
 */
final readonly class PublicPagesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every publicpage.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<PublicPageData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListPublicPagesRequest($page, $perPage))->dto();
    }


    /**
     * Create a publicpage.
     *
     * @param  CreatePublicPagePayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return PublicPageData
     */
    public function create(\Academorix\PlatformPublicSiteSdk\Payloads\PublicPages\CreatePublicPagePayload $payload, ?string $idempotencyKey = null): PublicPageData
    {
        return $this->connector->send(new CreatePublicPageRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one publicpage.
     *
     * @param  string  $page                   Path parameter — page.
     *
     * @return PublicPageData
     */
    public function show(string $page): PublicPageData
    {
        return $this->connector->send(new ShowPublicPageRequest($page))->dto();
    }


    /**
     * Update one publicpage.
     *
     * @param  string  $page                   Path parameter — page.
     * @param  UpdatePublicPagePayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return PublicPageData
     */
    public function update(string $page, \Academorix\PlatformPublicSiteSdk\Payloads\PublicPages\UpdatePublicPagePayload $payload, ?string $idempotencyKey = null): PublicPageData
    {
        return $this->connector->send(new UpdatePublicPageRequest($page, $payload, $idempotencyKey))->dto();
    }
}
