<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Requests\WaitlistEntries;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsRegistrationsSdk\Data\WaitlistEntryData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `DELETE /api/v1/waitlist-entries/{entry}` — delete one WaitlistEntry.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
final class DeleteWaitlistEntryRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::DELETE;

    /**
     * @param  string       $entry                  Path parameter — entry.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly string $entry,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/waitlist-entries/' . rawurlencode($this->entry);
    }

    /**
     * Attach the caller-supplied idempotency key when one was provided.
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
     * Delete returns 204 No Content — no DTO to hydrate.
     */
    public function createDtoFromResponse(Response $response): null
    {
        return null;
    }
}
