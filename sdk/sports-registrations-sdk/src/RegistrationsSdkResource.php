<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `registrations` module.
 *
 * Registered under `#[AsSdkResource(name: 'registrations', service: 'sports')]`
 * so the Sports service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->registrations()->...`.
 *
 * ## Peer Resources
 *
 * - OffersResource — peer resource for `offers`.
 * - RegistrationsResource — peer resource for `registrations`.
 * - TrialBookingsResource — peer resource for `trial-bookings`.
 * - WaitlistEntriesResource — peer resource for `waitlist-entries`.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'registrations', service: 'sports')]
final class RegistrationsSdkResource extends BaseSdkResource
{
    private ?Resources\OffersResource $offers = null;
    private ?Resources\RegistrationsResource $registrations = null;
    private ?Resources\TrialBookingsResource $trialBookings = null;
    private ?Resources\WaitlistEntriesResource $waitlistEntries = null;

    /**
     * Access Offers peer Resource.
     */
    public function offers(): Resources\OffersResource
    {
        return $this->offers ??= new Resources\OffersResource($this->connector);
    }

    /**
     * Access Registrations peer Resource.
     */
    public function registrations(): Resources\RegistrationsResource
    {
        return $this->registrations ??= new Resources\RegistrationsResource($this->connector);
    }

    /**
     * Access TrialBookings peer Resource.
     */
    public function trialBookings(): Resources\TrialBookingsResource
    {
        return $this->trialBookings ??= new Resources\TrialBookingsResource($this->connector);
    }

    /**
     * Access WaitlistEntries peer Resource.
     */
    public function waitlistEntries(): Resources\WaitlistEntriesResource
    {
        return $this->waitlistEntries ??= new Resources\WaitlistEntriesResource($this->connector);
    }
}
