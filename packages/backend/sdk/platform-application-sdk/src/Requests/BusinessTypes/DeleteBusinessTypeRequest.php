<?php

/**
 * @file packages/sdk/platform-application-sdk/src/Requests/BusinessTypes/DeleteBusinessTypeRequest.php
 *
 * @description
 * `DELETE /api/v1/business-types/{key}` — the **platform-admin**
 * BusinessType removal. The Platform service refuses to delete a
 * key currently in use by any Workspace (`422 business_type_in_use`);
 * otherwise the row is dropped from `data/business-types.json` +
 * `config/workspaces.php` and the resolver cache is invalidated.
 * Successful response is `204 No Content`.
 */

declare(strict_types=1);

namespace Stackra\PlatformApplicationSdk\Requests\BusinessTypes;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `DELETE /api/v1/business-types/{key}` — remove from catalogue.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class DeleteBusinessTypeRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::DELETE;

    /**
     * @param  string       $key             BusinessType key (`^[a-z][a-z0-9_]*$`).
     * @param  string|null  $idempotencyKey  Optional replay-safety token.
     */
    public function __construct(
        public readonly string $key,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/business-types/' . rawurlencode($this->key);
    }

    /**
     * Attach the caller-supplied idempotency key when one was
     * provided.
     *
     * @return array<string, string>
     */
    protected function defaultHeaders(): array
    {
        return $this->idempotencyKey !== null
            ? ['Idempotency-Key' => $this->idempotencyKey]
            : [];
    }

    /**
     * The Platform service returns `204 No Content` on a successful
     * delete. Sentinel-only DTO — the caller reads the HTTP status
     * to confirm.
     */
    public function createDtoFromResponse(Response $response): bool
    {
        // fail-soft — see DeleteApplicationRequest for the same
        // reasoning: Saloon's `dtoOrFail()` already threw on non-2xx
        // by the time we're here.
        return true;
    }
}
