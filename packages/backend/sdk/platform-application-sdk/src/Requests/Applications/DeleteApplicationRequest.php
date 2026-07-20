<?php

/**
 * @file packages/sdk/platform-application-sdk/src/Requests/Applications/DeleteApplicationRequest.php
 *
 * @description
 * `DELETE /api/v1/applications/{id}` — the **platform-admin** soft
 * delete. Applications are never hard-deleted (per the schema's
 * `SoftDeletes` behaviour); this endpoint sets `deleted_at` and
 * removes the row from every non-`with_trashed` list. The server
 * returns `204 No Content` on success, so this request emits no
 * response DTO.
 */

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Requests\Applications;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `DELETE /api/v1/applications/{id}` — soft-delete.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class DeleteApplicationRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::DELETE;

    /**
     * @param  string       $id              Prefixed ULID (`app_<26 chars>`).
     * @param  string|null  $idempotencyKey  Optional replay-safety token — reissuing the same DELETE with the same key returns the same 204 (or 404) rather than "already-deleted" noise.
     */
    public function __construct(
        public readonly string $id,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/applications/' . rawurlencode($this->id);
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
     * soft-delete. There is no envelope to hydrate; the caller
     * checks the response status instead.
     *
     * @return true  Sentinel — always `true` when the request succeeded (Saloon's `dtoOrFail()` throws before this fires on non-2xx).
     */
    public function createDtoFromResponse(Response $response): bool
    {
        // fail-soft — the Resource layer above only reads the
        // return value to satisfy Saloon's `dtoOrFail()`; the actual
        // "did it succeed" signal is the HTTP status the response
        // carries.
        return true;
    }
}
