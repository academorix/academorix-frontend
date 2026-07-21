<?php

declare(strict_types=1);

namespace Stackra\PlatformCredentialsSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `credentials` module.
 *
 * Registered under `#[AsSdkResource(name: 'credentials', service: 'platform')]`
 * so the Platform service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->credentials()->...`.
 *
 * ## Peer Resources
 *
 * - CheckinLogsResource — peer resource for `checkin-logs`.
 * - CredentialsResource — peer resource for `credentials`.
 * - GatesResource — peer resource for `gates`.
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'credentials', service: 'platform')]
final class CredentialsSdkResource extends BaseSdkResource
{
    private ?Resources\CheckinLogsResource $checkinLogs = null;
    private ?Resources\CredentialsResource $credentials = null;
    private ?Resources\GatesResource $gates = null;

    /**
     * Access CheckinLogs peer Resource.
     */
    public function checkinLogs(): Resources\CheckinLogsResource
    {
        return $this->checkinLogs ??= new Resources\CheckinLogsResource($this->connector);
    }

    /**
     * Access Credentials peer Resource.
     */
    public function credentials(): Resources\CredentialsResource
    {
        return $this->credentials ??= new Resources\CredentialsResource($this->connector);
    }

    /**
     * Access Gates peer Resource.
     */
    public function gates(): Resources\GatesResource
    {
        return $this->gates ??= new Resources\GatesResource($this->connector);
    }
}
