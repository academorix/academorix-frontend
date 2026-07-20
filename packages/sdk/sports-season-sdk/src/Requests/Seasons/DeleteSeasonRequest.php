<?php

declare(strict_types=1);

namespace Academorix\SportsSeasonSdk\Requests\Seasons;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsSeasonSdk\Data\SeasonData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `DELETE /api/v1/seasons/{season}` — delete one Season.
 *
 * @category SeasonSdk
 *
 * @since    0.1.0
 */
final class DeleteSeasonRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::DELETE;

    /**
     * @param  string       $season                 Path parameter — season.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly string $season,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/seasons/' . rawurlencode($this->season);
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
