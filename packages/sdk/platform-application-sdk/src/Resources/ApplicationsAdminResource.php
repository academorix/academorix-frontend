<?php

/**
 * @file packages/sdk/platform-application-sdk/src/Resources/ApplicationsAdminResource.php
 *
 * @description
 * Platform-admin Applications surface. Wraps the five admin-tier
 * Saloon requests behind a typed façade — full CRUD + `?with_trashed`
 * on list. Every mutation accepts an optional `Idempotency-Key` so
 * retries never double-write.
 *
 * ## Auth
 *
 * The Platform service enforces `role: platform_admin` on this
 * surface; the connector attaches the Sanctum PAT via the Bearer
 * scheme. A missing or under-privileged token yields
 * {@see \Academorix\ApiSdk\Exceptions\AuthenticationException} /
 * {@see \Academorix\ApiSdk\Exceptions\AuthorizationException}.
 */

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformApplicationSdk\Data\ApplicationData;
use Academorix\PlatformApplicationSdk\Payloads\Applications\CreateApplicationPayload;
use Academorix\PlatformApplicationSdk\Payloads\Applications\UpdateApplicationPayload;
use Academorix\PlatformApplicationSdk\Requests\Applications\CreateApplicationRequest;
use Academorix\PlatformApplicationSdk\Requests\Applications\DeleteApplicationRequest;
use Academorix\PlatformApplicationSdk\Requests\Applications\ListApplicationsAdminRequest;
use Academorix\PlatformApplicationSdk\Requests\Applications\ShowApplicationAdminRequest;
use Academorix\PlatformApplicationSdk\Requests\Applications\UpdateApplicationRequest;

/**
 * Platform-admin Applications surface — full CRUD.
 *
 * ## Example
 *
 * ```php
 * use Academorix\PlatformSdk\Client\PlatformSdk;
 *
 * $admin = app(PlatformSdk::class)->application()->applicationsAdmin();
 * $new   = $admin->create(new CreateApplicationPayload(
 *     slug: 'ticketing',
 *     name: 'Ticketing',
 *     centralHost: 'ticketing.academorix.app',
 *     platformAdminHost: 'admin.ticketing.academorix.app',
 * ), idempotencyKey: 'idem-create-ticketing-v1');
 * ```
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final readonly class ApplicationsAdminResource
{
    /**
     * @param  ApiConnector  $connector  The Platform service's shared Saloon connector.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

    /**
     * `GET /api/v1/applications` — admin list, paginated.
     *
     * @param  int|null   $page          1-indexed page number.
     * @param  int|null   $perPage       Items per page.
     * @param  bool|null  $withTrashed   When `true`, include soft-deleted rows (requires `application.viewTrashed`).
     * @return PaginatedResponse<ApplicationData>
     *
     * @throws \Academorix\ApiSdk\Exceptions\ApiRequestException
     */
    public function list(?int $page = null, ?int $perPage = null, ?bool $withTrashed = null): PaginatedResponse
    {
        /** @var PaginatedResponse<ApplicationData> $dto */
        $dto = $this->connector
            ->send(new ListApplicationsAdminRequest($page, $perPage, $withTrashed))
            ->dtoOrFail();

        return $dto;
    }

    /**
     * `GET /api/v1/applications/{id}` — admin lookup by ULID.
     *
     * @param  string  $id  Prefixed ULID (`app_<26 chars>`).
     * @return ApplicationData
     *
     * @throws \Academorix\ApiSdk\Exceptions\ResourceNotFoundException
     * @throws \Academorix\ApiSdk\Exceptions\ApiRequestException
     */
    public function show(string $id): ApplicationData
    {
        /** @var ApplicationData $dto */
        $dto = $this->connector
            ->send(new ShowApplicationAdminRequest($id))
            ->dtoOrFail();

        return $dto;
    }

    /**
     * `POST /api/v1/applications` — create a new Application.
     *
     * @param  CreateApplicationPayload  $payload         Validated create payload.
     * @param  string|null               $idempotencyKey  Optional replay-safety token.
     * @return ApplicationData                            The freshly-persisted Application.
     *
     * @throws \Academorix\ApiSdk\Exceptions\ValidationException   On invalid payload.
     * @throws \Academorix\ApiSdk\Exceptions\ApiRequestException   On any other failure.
     */
    public function create(CreateApplicationPayload $payload, ?string $idempotencyKey = null): ApplicationData
    {
        /** @var ApplicationData $dto */
        $dto = $this->connector
            ->send(new CreateApplicationRequest($payload, $idempotencyKey))
            ->dtoOrFail();

        return $dto;
    }

    /**
     * `PATCH /api/v1/applications/{id}` — partial update.
     *
     * @param  string                    $id              Prefixed ULID.
     * @param  UpdateApplicationPayload  $payload         Partial update payload — only mutated fields go on the wire.
     * @param  string|null               $idempotencyKey  Optional replay-safety token.
     * @return ApplicationData                            The updated Application.
     *
     * @throws \Academorix\ApiSdk\Exceptions\ResourceNotFoundException  When `id` is unknown.
     * @throws \Academorix\ApiSdk\Exceptions\ValidationException        On invalid payload.
     * @throws \Academorix\ApiSdk\Exceptions\ApiRequestException        On any other failure.
     */
    public function update(string $id, UpdateApplicationPayload $payload, ?string $idempotencyKey = null): ApplicationData
    {
        /** @var ApplicationData $dto */
        $dto = $this->connector
            ->send(new UpdateApplicationRequest($id, $payload, $idempotencyKey))
            ->dtoOrFail();

        return $dto;
    }

    /**
     * `DELETE /api/v1/applications/{id}` — soft-delete.
     *
     * @param  string       $id              Prefixed ULID.
     * @param  string|null  $idempotencyKey  Optional replay-safety token.
     *
     * @throws \Academorix\ApiSdk\Exceptions\ResourceNotFoundException  When `id` is unknown.
     * @throws \Academorix\ApiSdk\Exceptions\ApiRequestException        On any other failure.
     */
    public function delete(string $id, ?string $idempotencyKey = null): void
    {
        // dtoOrFail returns a sentinel `true` for DELETEs; we discard
        // it and rely on the thrown-on-non-2xx guarantee from the
        // connector's ThrowOnFailureMiddleware for the "did it
        // succeed" answer.
        $this->connector
            ->send(new DeleteApplicationRequest($id, $idempotencyKey))
            ->dtoOrFail();
    }
}
