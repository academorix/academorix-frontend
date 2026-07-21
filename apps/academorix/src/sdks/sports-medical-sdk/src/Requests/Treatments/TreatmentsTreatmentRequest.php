<?php

declare(strict_types=1);

namespace Stackra\SportsMedicalSdk\Requests\Treatments;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SportsMedicalSdk\Data\TreatmentData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `POST /api/v1/injuries/{injury}/treatments` — custom — custom endpoint (hand-implement).
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
final class TreatmentsTreatmentRequest extends BaseSdkRequest implements HasBody
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::POST;

    /**
     * @param  string       $injury                 Path parameter — injury.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly string $injury,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/injuries/' . rawurlencode($this->injury) . '/treatments';
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
     * Custom endpoint — hand-implement the response shape here.
     *
     * @return mixed
     */
    public function createDtoFromResponse(Response $response): mixed
    {
        // TODO(sdk): hand-implement — this custom endpoint's response
        // shape is not covered by the standard CRUD template. Return
        // the appropriate DTO from src/Data/ once the shape is
        // clarified.
        return $response->json();
    }
}
