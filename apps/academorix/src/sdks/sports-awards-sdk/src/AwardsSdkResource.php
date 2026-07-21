<?php

declare(strict_types=1);

namespace Stackra\SportsAwardsSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `awards` module.
 *
 * Registered under `#[AsSdkResource(name: 'awards', service: 'sports')]`
 * so the Sports service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->awards()->...`.
 *
 * ## Peer Resources
 *
 * - AwardsResource — peer resource for `awards`.
 * - CertificatesResource — peer resource for `certificates`.
 *
 * @category AwardsSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'awards', service: 'sports')]
final class AwardsSdkResource extends BaseSdkResource
{
    private ?Resources\AwardsResource $awards = null;
    private ?Resources\CertificatesResource $certificates = null;

    /**
     * Access Awards peer Resource.
     */
    public function awards(): Resources\AwardsResource
    {
        return $this->awards ??= new Resources\AwardsResource($this->connector);
    }

    /**
     * Access Certificates peer Resource.
     */
    public function certificates(): Resources\CertificatesResource
    {
        return $this->certificates ??= new Resources\CertificatesResource($this->connector);
    }
}
