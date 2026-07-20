<?php

/**
 * @file packages/sdk/platform-application-sdk/src/Resources/BusinessTypesResource.php
 *
 * @description
 * Platform-admin BusinessType surface. Per the module blueprint, the
 * BusinessType catalogue has NO central-audience routes — every
 * endpoint requires `role: platform_admin`. This Resource is
 * therefore the admin-only façade; no sibling `BusinessTypesPublic`
 * exists. Every mutation supports an optional `Idempotency-Key`.
 *
 * ## Config-backed catalogue
 *
 * BusinessType is NOT an Eloquent table — the Platform service
 * writes each mutation through to `data/business-types.json` +
 * `config/workspaces.php` and hot-reloads the resolver. This means:
 *
 *   - `delete()` refuses (`422 business_type_in_use`) if any
 *     Workspace still references the key.
 *   - `create()` is idempotent on `key` — a second create with the
 *     same key returns the existing row (behaviour the schema pins
 *     to avoid partial writes across the JSON + config pair).
 */

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformApplicationSdk\Data\BusinessTypeData;
use Academorix\PlatformApplicationSdk\Payloads\BusinessTypes\CreateBusinessTypePayload;
use Academorix\PlatformApplicationSdk\Payloads\BusinessTypes\UpdateBusinessTypePayload;
use Academorix\PlatformApplicationSdk\Requests\BusinessTypes\CreateBusinessTypeRequest;
use Academorix\PlatformApplicationSdk\Requests\BusinessTypes\DeleteBusinessTypeRequest;
use Academorix\PlatformApplicationSdk\Requests\BusinessTypes\ListBusinessTypesRequest;
use Academorix\PlatformApplicationSdk\Requests\BusinessTypes\ShowBusinessTypeRequest;
use Academorix\PlatformApplicationSdk\Requests\BusinessTypes\UpdateBusinessTypeRequest;

/**
 * Platform-admin BusinessType catalogue surface — full CRUD.
 *
 * ## Example
 *
 * ```php
 * use Academorix\PlatformSdk\Client\PlatformSdk;
 *
 * $catalogue = app(PlatformSdk::class)->application()->businessTypes();
 * $page      = $catalogue->list(includeTranslations: true);
 * $academy   = $catalogue->show('academy');
 * ```
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final readonly class BusinessTypesResource
{
    /**
     * @param  ApiConnector  $connector  The Platform service's shared Saloon connector.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

    /**
     * `GET /api/v1/business-types` — paginated list.
     *
     * @param  int|null   $page                  1-indexed page number.
     * @param  int|null   $perPage               Items per page.
     * @param  bool|null  $includeTranslations   When `true`, request the full per-locale translation blob.
     * @param  bool|null  $onlyVisible           When `true`, filter out `is_visible = false` entries.
     * @return PaginatedResponse<BusinessTypeData>
     *
     * @throws \Academorix\ApiSdk\Exceptions\ApiRequestException
     */
    public function list(
        ?int $page = null,
        ?int $perPage = null,
        ?bool $includeTranslations = null,
        ?bool $onlyVisible = null,
    ): PaginatedResponse {
        /** @var PaginatedResponse<BusinessTypeData> $dto */
        $dto = $this->connector
            ->send(new ListBusinessTypesRequest($page, $perPage, $includeTranslations, $onlyVisible))
            ->dtoOrFail();

        return $dto;
    }

    /**
     * `GET /api/v1/business-types/{key}` — resolve one entry.
     *
     * @param  string     $key                  BusinessType key.
     * @param  bool|null  $includeTranslations  When `true`, include the per-locale translation blob.
     * @return BusinessTypeData
     *
     * @throws \Academorix\ApiSdk\Exceptions\ResourceNotFoundException  When `$key` isn't in the catalogue.
     * @throws \Academorix\ApiSdk\Exceptions\ApiRequestException
     */
    public function show(string $key, ?bool $includeTranslations = null): BusinessTypeData
    {
        /** @var BusinessTypeData $dto */
        $dto = $this->connector
            ->send(new ShowBusinessTypeRequest($key, $includeTranslations))
            ->dtoOrFail();

        return $dto;
    }

    /**
     * `POST /api/v1/business-types` — create a new catalogue entry.
     *
     * @param  CreateBusinessTypePayload  $payload         Validated create payload.
     * @param  string|null                $idempotencyKey  Optional replay-safety token.
     * @return BusinessTypeData                            The freshly-persisted entry.
     *
     * @throws \Academorix\ApiSdk\Exceptions\ValidationException
     * @throws \Academorix\ApiSdk\Exceptions\ApiRequestException
     */
    public function create(CreateBusinessTypePayload $payload, ?string $idempotencyKey = null): BusinessTypeData
    {
        /** @var BusinessTypeData $dto */
        $dto = $this->connector
            ->send(new CreateBusinessTypeRequest($payload, $idempotencyKey))
            ->dtoOrFail();

        return $dto;
    }

    /**
     * `PATCH /api/v1/business-types/{key}` — partial update.
     *
     * @param  string                     $key             The catalogue key. Immutable — never mutated by the payload.
     * @param  UpdateBusinessTypePayload  $payload         Partial update payload.
     * @param  string|null                $idempotencyKey  Optional replay-safety token.
     * @return BusinessTypeData                            The updated entry.
     *
     * @throws \Academorix\ApiSdk\Exceptions\ResourceNotFoundException  When `$key` isn't in the catalogue.
     * @throws \Academorix\ApiSdk\Exceptions\ValidationException
     * @throws \Academorix\ApiSdk\Exceptions\ApiRequestException
     */
    public function update(string $key, UpdateBusinessTypePayload $payload, ?string $idempotencyKey = null): BusinessTypeData
    {
        /** @var BusinessTypeData $dto */
        $dto = $this->connector
            ->send(new UpdateBusinessTypeRequest($key, $payload, $idempotencyKey))
            ->dtoOrFail();

        return $dto;
    }

    /**
     * `DELETE /api/v1/business-types/{key}` — remove from catalogue.
     *
     * @param  string       $key             The catalogue key.
     * @param  string|null  $idempotencyKey  Optional replay-safety token.
     *
     * @throws \Academorix\ApiSdk\Exceptions\ResourceNotFoundException  When `$key` isn't in the catalogue.
     * @throws \Academorix\ApiSdk\Exceptions\ApiRequestException        The server responds `422 business_type_in_use` (also an ApiRequestException subclass) when a Workspace still references the key.
     */
    public function delete(string $key, ?string $idempotencyKey = null): void
    {
        $this->connector
            ->send(new DeleteBusinessTypeRequest($key, $idempotencyKey))
            ->dtoOrFail();
    }
}
