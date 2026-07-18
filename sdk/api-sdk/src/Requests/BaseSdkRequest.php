<?php

/**
 * @file packages/sdk/api-sdk/src/Requests/BaseSdkRequest.php
 *
 * @description
 * Optional base class for every Saloon `Request` shipped by a
 * module's SDK sibling. Extending is NOT required — Saloon's
 * `Saloon\Http\Request` works fine on its own — but this base
 * adds:
 *
 *   - A `DEFAULT_CONTENT_TYPE` constant for consistent JSON
 *     dispatch semantics.
 *   - A `createDtoFromResponse()` hook that pipes into Spatie
 *     Data classes by default (concrete requests override to
 *     return their specific DTO type).
 *
 * ## Saloon-side conventions
 *
 * Concrete requests declare:
 *
 *   - `protected Method $method` — one of `Method::GET`,
 *     `Method::POST`, etc.
 *   - `public function resolveEndpoint(): string` — the URL
 *     path (relative to the connector's base URL).
 *
 * Consumers of the request typically call:
 *
 *   ```php
 *   $data = $this->connector()->send(new FindTenantRequest($id))->dtoOrFail();
 *   ```
 *
 * `dtoOrFail()` throws the same typed exception hierarchy
 * `ThrowOnFailureMiddleware` produces — so retry + auth +
 * validation errors all surface as their respective classes.
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Requests;

use Saloon\Http\Request;

/**
 * Optional base class for SDK requests. Extend to inherit
 * consistent JSON dispatch semantics.
 */
abstract class BaseSdkRequest extends Request
{
    /**
     * Default `Content-Type` — every SDK request that ships a
     * body is JSON unless the concrete subclass overrides via
     * a `HasMultipartBody` trait or similar.
     */
    public const string DEFAULT_CONTENT_TYPE = 'application/json';
}
