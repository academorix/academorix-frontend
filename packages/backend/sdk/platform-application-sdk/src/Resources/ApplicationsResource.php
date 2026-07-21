<?php

/**
 * @file packages/sdk/platform-application-sdk/src/Resources/ApplicationsResource.php
 *
 * @description
 * Public / central Applications surface. Wraps the two central-tier
 * Saloon requests ({@see ListApplicationsRequest},
 * {@see ShowApplicationRequest}) behind a typed façade. No auth
 * required at the endpoint level — the connector still sends bearer
 * credentials when one is configured, but the server refuses to
 * reveal anything beyond the discoverable public metadata.
 *
 * This Resource has NO mutations by design — the mutation
 * endpoints all live behind the platform-admin surface on
 * {@see ApplicationsAdminResource}.
 */

declare(strict_types=1);

namespace Stackra\PlatformApplicationSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformApplicationSdk\Data\ApplicationData;
use Stackra\PlatformApplicationSdk\Requests\Applications\ListApplicationsRequest;
use Stackra\PlatformApplicationSdk\Requests\Applications\ShowApplicationRequest;

/**
 * Public / central-audience Applications surface.
 *
 * ## What this Resource owns
 *
 * The two read-only endpoints callers on marketing sites +
 * workspace-picker screens need. Neither method takes an
 * `Idempotency-Key` — both are safe idempotent reads.
 *
 * ## Example
 *
 * ```php
 * use Stackra\PlatformSdk\Client\PlatformSdk;
 *
 * $platform = app(PlatformSdk::class);
 * $sports = $platform->application()->applications()->show('sports');
 * $sports->centralUrl;   // 'https://sports.stackra.app'
 * ```
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final readonly class ApplicationsResource
{
    /**
     * @param  ApiConnector  $connector  The Platform service's shared Saloon connector, wired once by {@see \Stackra\PlatformSdk\Providers\PlatformSdkServiceProvider}.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

    /**
     * `GET /api/v1/applications` — list every discoverable
     * Application, paginated.
     *
     * @param  int|null  $page     1-indexed page number; server default = 1.
     * @param  int|null  $perPage  Items per page; server default = 15.
     * @return PaginatedResponse<ApplicationData>  Hydrated page + `meta` + `links`.
     *
     * @throws \Stackra\ApiSdk\Exceptions\ApiRequestException  On any 4xx/5xx or network failure — subclasses narrow to `RateLimitException`, `ServerException`, etc.
     *
     * @example ```php
     * $page = app(PlatformSdk::class)->application()->applications()->list(page: 2, perPage: 25);
     * foreach ($page->data as $app) { $app->slug; }
     * ```
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        /** @var PaginatedResponse<ApplicationData> $dto */
        $dto = $this->connector
            ->send(new ListApplicationsRequest($page, $perPage))
            ->dtoOrFail();

        return $dto;
    }

    /**
     * `GET /api/v1/applications/{slug}` — resolve one Application
     * by its public slug.
     *
     * @param  string  $slug  URL-safe application identifier.
     * @return ApplicationData
     *
     * @throws \Stackra\ApiSdk\Exceptions\ResourceNotFoundException  When no Application matches `$slug`.
     * @throws \Stackra\ApiSdk\Exceptions\ApiRequestException        On any other 4xx/5xx or network failure.
     *
     * @example ```php
     * $app = app(PlatformSdk::class)->application()->applications()->show('education');
     * $app->defaultLocale;  // 'en-US'
     * ```
     */
    public function show(string $slug): ApplicationData
    {
        /** @var ApplicationData $dto */
        $dto = $this->connector
            ->send(new ShowApplicationRequest($slug))
            ->dtoOrFail();

        return $dto;
    }
}
