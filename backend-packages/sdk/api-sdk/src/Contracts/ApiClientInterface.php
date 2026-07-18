<?php

/**
 * @file packages/sdk/api-sdk/src/Contracts/ApiClientInterface.php
 *
 * @description
 * Public consumer-facing contract of the SDK. Every method
 * beyond the base surface is discovered — the interface itself
 * carries only the reflection points a static analyser can bind
 * to.
 *
 * Consumers depend on this interface (never on the concrete
 * `ApiClient` class) so tests can bind
 * {@see \Academorix\ApiSdk\Testing\ApiFake} in its place without
 * subclass gymnastics.
 *
 * ## Dispatching resources
 *
 * The dominant usage is `$api->tenancy()->find($id)`. `tenancy`
 * is not declared on this interface — it's dispatched through
 * PHP's `__call()`. Static analysers see the dispatch as an
 * `object`; IDEs benefit from `@method` docblocks stamped on
 * this interface. Each sibling SDK contributes its own
 * `@method` line here when its resource registers with
 * `#[AsSdkResource]`.
 *
 * @method \Academorix\ApiTenancySdk\TenancySdkResource tenancy() Access the tenancy resource (tenant lookups, memberships, domains, settings, branding).
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Contracts;

use Academorix\ApiSdk\Registry\SdkResourceRegistry;

interface ApiClientInterface
{
    /**
     * Look up a discovered resource by name. Prefer the magic
     * dispatch (`$api->tenancy()`) for the 90% case; this
     * explicit accessor is for dynamic dispatch (feature flags,
     * plugin-style consumers) where the name isn't known at
     * compile time.
     *
     * @throws \Academorix\ApiSdk\Exceptions\ResourceNotFoundException When no resource is registered under `$name`.
     */
    public function resource(string $name): SdkResource;

    /**
     * Return every registered resource. Useful for diagnostic
     * commands (`php artisan academorix:sdk-api:describe`) and
     * generating IDE meta-files.
     */
    public function registry(): SdkResourceRegistry;
}
