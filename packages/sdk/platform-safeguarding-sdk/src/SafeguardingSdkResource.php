<?php

declare(strict_types=1);

namespace Academorix\PlatformSafeguardingSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `safeguarding` module.
 *
 * Registered under `#[AsSdkResource(name: 'safeguarding', service: 'platform')]`
 * so the Platform service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->safeguarding()->...`.
 *
 * ## Peer Resources
 *
 * - BackgroundChecksResource — peer resource for `background-checks`.
 * - PolicyAcknowledgementsResource — peer resource for `policy-acknowledgements`.
 *
 * @category SafeguardingSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'safeguarding', service: 'platform')]
final class SafeguardingSdkResource extends BaseSdkResource
{
    private ?Resources\BackgroundChecksResource $backgroundChecks = null;
    private ?Resources\PolicyAcknowledgementsResource $policyAcknowledgements = null;

    /**
     * Access BackgroundChecks peer Resource.
     */
    public function backgroundChecks(): Resources\BackgroundChecksResource
    {
        return $this->backgroundChecks ??= new Resources\BackgroundChecksResource($this->connector);
    }

    /**
     * Access PolicyAcknowledgements peer Resource.
     */
    public function policyAcknowledgements(): Resources\PolicyAcknowledgementsResource
    {
        return $this->policyAcknowledgements ??= new Resources\PolicyAcknowledgementsResource($this->connector);
    }
}
