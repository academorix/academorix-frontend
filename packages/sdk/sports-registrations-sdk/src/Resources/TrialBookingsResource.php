<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsRegistrationsSdk\Data\TrialBookingData;
use Academorix\SportsRegistrationsSdk\Requests\TrialBookings\ListTrialBookingsRequest;
use Academorix\SportsRegistrationsSdk\Requests\TrialBookings\UpdateTrialBookingRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `trial-bookings` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/TrialBookings/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
final readonly class TrialBookingsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every trialbooking.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<TrialBookingData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListTrialBookingsRequest($page, $perPage))->dto();
    }


    /**
     * Update one trialbooking.
     *
     * @param  string  $trial                  Path parameter — trial.
     * @param  UpdateTrialBookingPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return TrialBookingData
     */
    public function update(string $trial, \Academorix\SportsRegistrationsSdk\Payloads\TrialBookings\UpdateTrialBookingPayload $payload, ?string $idempotencyKey = null): TrialBookingData
    {
        return $this->connector->send(new UpdateTrialBookingRequest($trial, $payload, $idempotencyKey))->dto();
    }
}
