<?php

declare(strict_types=1);

namespace Academorix\IdentitySdk\Client;

use Academorix\ApiSdk\Contracts\SdkResource;
use Academorix\ApiSdk\Registry\SdkResourceRegistry;

/**
 * Consumer-facing facade for the Identity service SDK.
 *
 * Every `$identity->{resource}()` call dispatches through `__call()` into the
 * service-scoped {@see SdkResourceRegistry} populated at boot by
 * {@see \Academorix\IdentitySdk\Providers\IdentitySdkServiceProvider}. Distinct
 * from the kernel `ApiClient` so each service exposes its own typed facade
 * bound to its own connector (its own base URL).
 *
 * Immutable + Octane-safe: the registry is populated once and its resources
 * are stateless (only an immutable connector reference).
 */
final readonly class IdentitySdk
{
    /**
     * @param  SdkResourceRegistry  $registry  Registry populated by the service provider's discovery pass.
     */
    public function __construct(
        private SdkResourceRegistry $registry,
    ) {
    }

    /**
     * Fetch a discovered resource by its `#[AsSdkResource]` name.
     *
     * @throws \Academorix\ApiSdk\Exceptions\ResourceNotFoundException When none registered under `$name`.
     */
    public function resource(string $name): SdkResource
    {
        return $this->registry->get($name);
    }

    /**
     * The underlying registry — useful for diagnostics.
     */
    public function registry(): SdkResourceRegistry
    {
        return $this->registry;
    }

    /**
     * Dispatch `$identity->{name}()` into the registry.
     *
     * @param  array<int|string, mixed>  $args  Ignored; reserved for future context-scoped resources.
     */
    public function __call(string $name, array $args): SdkResource
    {
        return $this->registry->get($name);
    }

    /**
     * Dispatch property-access (`$identity->{name}`) into the registry.
     */
    public function __get(string $name): SdkResource
    {
        return $this->registry->get($name);
    }
}
