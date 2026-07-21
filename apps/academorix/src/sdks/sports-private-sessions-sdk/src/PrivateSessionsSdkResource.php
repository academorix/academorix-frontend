<?php

declare(strict_types=1);

namespace Stackra\SportsPrivateSessionsSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `private-sessions` module.
 *
 * Registered under `#[AsSdkResource(name: 'private-sessions', service: 'sports')]`
 * so the Sports service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->privateSessions()->...`.
 *
 * ## Peer Resources
 *
 * - PrivateSessionRequestsResource — peer resource for `private-session-requests`.
 * - SessionCreditsResource — peer resource for `session-credits`.
 *
 * @category PrivateSessionsSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'private-sessions', service: 'sports')]
final class PrivateSessionsSdkResource extends BaseSdkResource
{
    private ?Resources\PrivateSessionRequestsResource $privateSessionRequests = null;
    private ?Resources\SessionCreditsResource $sessionCredits = null;

    /**
     * Access PrivateSessionRequests peer Resource.
     */
    public function privateSessionRequests(): Resources\PrivateSessionRequestsResource
    {
        return $this->privateSessionRequests ??= new Resources\PrivateSessionRequestsResource($this->connector);
    }

    /**
     * Access SessionCredits peer Resource.
     */
    public function sessionCredits(): Resources\SessionCreditsResource
    {
        return $this->sessionCredits ??= new Resources\SessionCreditsResource($this->connector);
    }
}
