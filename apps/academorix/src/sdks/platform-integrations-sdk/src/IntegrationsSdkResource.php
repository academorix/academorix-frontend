<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `integrations` module.
 *
 * Registered under `#[AsSdkResource(name: 'integrations', service: 'platform')]`
 * so the Platform service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->integrations()->...`.
 *
 * ## Peer Resources
 *
 * - AppInstallationsResource — peer resource for `app-installations`.
 * - AppWebhookSubscriptionsResource — peer resource for `app-webhook-subscriptions`.
 * - AppsResource — peer resource for `apps`.
 * - IntegrationProvidersResource — peer resource for `integration-providers`.
 * - TenantIntegrationsResource — peer resource for `tenant-integrations`.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'integrations', service: 'platform')]
final class IntegrationsSdkResource extends BaseSdkResource
{
    private ?Resources\AppInstallationsResource $appInstallations = null;
    private ?Resources\AppWebhookSubscriptionsResource $appWebhookSubscriptions = null;
    private ?Resources\AppsResource $apps = null;
    private ?Resources\IntegrationProvidersResource $integrationProviders = null;
    private ?Resources\TenantIntegrationsResource $tenantIntegrations = null;

    /**
     * Access AppInstallations peer Resource.
     */
    public function appInstallations(): Resources\AppInstallationsResource
    {
        return $this->appInstallations ??= new Resources\AppInstallationsResource($this->connector);
    }

    /**
     * Access AppWebhookSubscriptions peer Resource.
     */
    public function appWebhookSubscriptions(): Resources\AppWebhookSubscriptionsResource
    {
        return $this->appWebhookSubscriptions ??= new Resources\AppWebhookSubscriptionsResource($this->connector);
    }

    /**
     * Access Apps peer Resource.
     */
    public function apps(): Resources\AppsResource
    {
        return $this->apps ??= new Resources\AppsResource($this->connector);
    }

    /**
     * Access IntegrationProviders peer Resource.
     */
    public function integrationProviders(): Resources\IntegrationProvidersResource
    {
        return $this->integrationProviders ??= new Resources\IntegrationProvidersResource($this->connector);
    }

    /**
     * Access TenantIntegrations peer Resource.
     */
    public function tenantIntegrations(): Resources\TenantIntegrationsResource
    {
        return $this->tenantIntegrations ??= new Resources\TenantIntegrationsResource($this->connector);
    }
}
