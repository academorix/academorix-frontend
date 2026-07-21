<?php

declare(strict_types=1);

namespace Stackra\IdentityPeopleSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `people` module.
 *
 * Registered under `#[AsSdkResource(name: 'people', service: 'identity')]`
 * so the Identity service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->people()->...`.
 *
 * ## Peer Resources
 *
 * - PersonGuardianLinksResource — peer resource for `person-guardian-links`.
 * - PersonIdentitiesResource — peer resource for `person-identities`.
 * - TenantLinkRequestsResource — peer resource for `tenant-link-requests`.
 *
 * @category PeopleSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'people', service: 'identity')]
final class PeopleSdkResource extends BaseSdkResource
{
    private ?Resources\PersonGuardianLinksResource $personGuardianLinks = null;
    private ?Resources\PersonIdentitiesResource $personIdentities = null;
    private ?Resources\TenantLinkRequestsResource $tenantLinkRequests = null;

    /**
     * Access PersonGuardianLinks peer Resource.
     */
    public function personGuardianLinks(): Resources\PersonGuardianLinksResource
    {
        return $this->personGuardianLinks ??= new Resources\PersonGuardianLinksResource($this->connector);
    }

    /**
     * Access PersonIdentities peer Resource.
     */
    public function personIdentities(): Resources\PersonIdentitiesResource
    {
        return $this->personIdentities ??= new Resources\PersonIdentitiesResource($this->connector);
    }

    /**
     * Access TenantLinkRequests peer Resource.
     */
    public function tenantLinkRequests(): Resources\TenantLinkRequestsResource
    {
        return $this->tenantLinkRequests ??= new Resources\TenantLinkRequestsResource($this->connector);
    }
}
