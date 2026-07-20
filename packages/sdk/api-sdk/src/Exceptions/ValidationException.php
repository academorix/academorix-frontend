<?php

/**
 * @file packages/sdk/api-sdk/src/Exceptions/ValidationException.php
 *
 * @description
 * Thrown on HTTP 422 responses when the API's validation rules
 * rejected the request body. Carries a per-field errors map so
 * consumers can render form-level errors without re-parsing the
 * response.
 *
 * ## Payload shape assumption
 *
 * Assumes `apps/api` follows Laravel's convention:
 *
 * ```json
 * {
 *   "message": "The given data was invalid.",
 *   "errors": {
 *     "email":   ["The email must be a valid email address."],
 *     "domain":  ["The domain is already taken."]
 *   }
 * }
 * ```
 *
 * The exception's `errors()` accessor exposes the map directly.
 * When the API deviates (custom error envelope), the throw-on-
 * failure middleware falls back to an empty `errors` list and
 * the human-readable summary from `message`.
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Exceptions;

use Saloon\Http\Request;
use Saloon\Http\Response;
use Throwable;

/**
 * HTTP 422 — request body failed API-side validation.
 *
 * Not `final` so per-domain SDK siblings (e.g.
 * `DomainAlreadyExistsException` in the tenancy SDK) can narrow the
 * type for a specific validation collision while broad-brush 422
 * handlers still catch the base class.
 */
class ValidationException extends ApiRequestException
{
    /**
     * @param  string                             $message
     * @param  array<string, list<string>>        $errors    Per-field errors map, keyed by field name.
     * @param  Request|null                       $request
     * @param  Response|null                      $response
     * @param  Throwable|null                     $previous
     */
    public function __construct(
        string $message,
        private readonly array $errors = [],
        ?Request $request = null,
        ?Response $response = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 422, $request, $response, $previous);
    }

    /**
     * Per-field validation errors as returned by the API.
     *
     * @return array<string, list<string>>
     */
    public function errors(): array
    {
        return $this->errors;
    }

    /**
     * Convenience — returns the first error message for a single
     * field or `null` when the field has no errors. Useful for
     * inline form UIs.
     */
    public function firstErrorFor(string $field): ?string
    {
        return $this->errors[$field][0] ?? null;
    }

    /**
     * {@inheritDoc}
     *
     * Extends the base context with the per-field error keys
     * (values omitted — those may contain user-facing text that
     * the redact list doesn't cover).
     *
     * @return array<string, mixed>
     */
    public function context(): array
    {
        return parent::context() + [
            'sdk.validation_fields' => array_keys($this->errors),
        ];
    }
}
