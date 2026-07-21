<?php

declare(strict_types=1);

namespace Stackra\SportsRegistrationsSdk\Requests\TrialBookings;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SportsRegistrationsSdk\Data\TrialBookingData;
use Stackra\SportsRegistrationsSdk\Payloads\TrialBookings\UpdateTrialBookingPayload;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Response;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `PATCH /api/v1/trial-bookings/{trial}` — update one TrialBooking.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
final class UpdateTrialBookingRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     */
    protected Method $method = Method::PATCH;

    /**
     * @param  string       $trial                  Path parameter — trial.
     * @param  UpdateTrialBookingPayload        $payload         Validated payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly string $trial,
        public readonly UpdateTrialBookingPayload $payload,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/trial-bookings/' . rawurlencode($this->trial);
    }

    /**
     * Serialise the payload into the JSON body. Spatie Data's
     * `toArray()` strips any `Optional` sentinel values, so the
     * server only sees fields the caller explicitly set.
     *
     * @return array<string, mixed>
     */
    protected function defaultBody(): array
    {
        return $this->payload->toArray();
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
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see TrialBookingData}.
     */
    public function createDtoFromResponse(Response $response): TrialBookingData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return TrialBookingData::from($body);
    }
}
