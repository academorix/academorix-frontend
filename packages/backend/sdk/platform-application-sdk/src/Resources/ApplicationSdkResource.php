<?php

/**
 * @file packages/sdk/platform-application-sdk/src/Resources/ApplicationSdkResource.php
 *
 * @description
 * Discovery-marked SDK entry point for the `application` module of
 * the Platform service. Auto-discovered at boot by
 * {@see \Academorix\PlatformSdk\Providers\PlatformSdkServiceProvider}
 * because the attribute below carries `service: 'platform'`; the
 * provider attaches the shared Saloon connector via
 * `attachConnector()` before this class is exposed to consumers.
 *
 * ## Wiring flow
 *
 *   1. `composer dump-autoload` populates
 *      `olvlvl/composer-attribute-collector` with every
 *      `#[AsSdkResource]` target.
 *   2. On boot, `PlatformSdkServiceProvider` iterates the targets
 *      whose `service === 'platform'`, resolves each out of the
 *      container, and calls `attachConnector($this->connector)` on
 *      the instance.
 *   3. `SdkResourceRegistry::register('application', $this)` makes
 *      the resource reachable as `$platform->application()`.
 *
 * ## Consumer usage
 *
 * ```php
 * use Academorix\PlatformSdk\Client\PlatformSdk;
 *
 * $platform = app(PlatformSdk::class);
 *
 * // Public / central-audience — no auth required.
 * $sports = $platform->application()->applications()->show('sports');
 *
 * // Platform-admin surface — bearer token required.
 * $apps = $platform->application()->applicationsAdmin()->list();
 *
 * // BusinessType catalogue — platform-admin only.
 * $types = $platform->application()->businessTypes()->list();
 * ```
 *
 * @see \Academorix\PlatformApplicationSdk\Resources\ApplicationsResource
 * @see \Academorix\PlatformApplicationSdk\Resources\ApplicationsAdminResource
 * @see \Academorix\PlatformApplicationSdk\Resources\BusinessTypesResource
 */

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Resources;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK resource for the `application` module.
 *
 * ## What this class owns
 *
 * Three fluent Resources — one per audience segment × aggregate:
 *
 *   - {@see applications()}       — central / public Applications reads.
 *   - {@see applicationsAdmin()}  — platform-admin Applications CRUD.
 *   - {@see businessTypes()}      — platform-admin BusinessType CRUD.
 *
 * The Resources are instantiated lazily on first access + cached
 * per instance — the resource is bound once per worker as a
 * singleton, so this cache is Octane-safe (immutable connector
 * reference, stateless Resources).
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'application', service: 'platform')]
final class ApplicationSdkResource extends BaseSdkResource
{
    /**
     * Lazily-constructed central-audience Applications Resource.
     * `null` until first access; assigned once and reused thereafter.
     *
     * @var ApplicationsResource|null
     */
    private ?ApplicationsResource $applications = null;

    /**
     * Lazily-constructed platform-admin Applications Resource.
     *
     * @var ApplicationsAdminResource|null
     */
    private ?ApplicationsAdminResource $applicationsAdmin = null;

    /**
     * Lazily-constructed platform-admin BusinessTypes Resource.
     *
     * @var BusinessTypesResource|null
     */
    private ?BusinessTypesResource $businessTypes = null;

    /**
     * Return the public / central-audience Applications Resource.
     *
     * @return ApplicationsResource  Fluent façade over the two read-only central endpoints.
     */
    public function applications(): ApplicationsResource
    {
        // Cache lazily — a caller that never touches this method
        // never pays the construction cost. The connector is
        // captured through `connector()`, which throws if the
        // wiring pass hasn't attached one.
        return $this->applications ??= new ApplicationsResource($this->connector());
    }

    /**
     * Return the platform-admin Applications Resource.
     *
     * @return ApplicationsAdminResource  Fluent façade over the full-CRUD admin surface.
     */
    public function applicationsAdmin(): ApplicationsAdminResource
    {
        return $this->applicationsAdmin ??= new ApplicationsAdminResource($this->connector());
    }

    /**
     * Return the platform-admin BusinessTypes Resource.
     *
     * @return BusinessTypesResource  Fluent façade over the BusinessType catalogue CRUD.
     */
    public function businessTypes(): BusinessTypesResource
    {
        return $this->businessTypes ??= new BusinessTypesResource($this->connector());
    }
}
