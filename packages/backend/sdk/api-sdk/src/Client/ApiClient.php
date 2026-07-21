<?php

/**
 * @file packages/sdk/api-sdk/src/Client/ApiClient.php
 *
 * @description
 * Consumer-facing facade over the SDK resource registry. Every
 * `$api->tenancy()`, `$api->access()`, `$api->ai()` call
 * dispatches through PHP's `__call()` magic method into the
 * registry — no hard-coded resource list on the client.
 *
 * ## Contract vs. implementation
 *
 * Consumers depend on {@see \Stackra\ApiSdk\Contracts\ApiClientInterface};
 * this class is the default implementation the container binds.
 * Tests bind {@see \Stackra\ApiSdk\Testing\ApiFake} instead.
 *
 * ## `__call` semantics
 *
 * `$this->tenancy()` → `$this->registry->get('tenancy')`.
 *
 * The trailing arguments (`$args`) are ignored — resources are
 * NOT callable; the accessor style is chosen for symmetry with
 * BaseResource classes that live on Saloon connectors. Once you
 * have the resource you call its methods:
 *
 * ```php
 * $api->tenancy()->find($id);         // hit `TenancySdkResource::find(...)`
 * $api->access()->listRoles();        // hit `AccessSdkResource::listRoles(...)`
 * ```
 *
 * ## Static analysis
 *
 * Static analysers see `__call()` as returning `mixed`. To keep
 * the developer experience decent:
 *
 *   - Consumers can annotate the ApiClient variable's type as
 *     `Stackra\ApiSdk\Contracts\ApiClientInterface` and
 *     invoke `resource('tenancy')` explicitly for a typed return.
 *
 *   - The `stackra:sdk-api:generate-meta` command (planned)
 *     emits a `.phpstorm.meta.php` file mapping each resource
 *     name to its concrete class so IDE completion works.
 *
 * @see \Stackra\ApiSdk\Registry\SdkResourceRegistry Underlying registry.
 * @see \Stackra\ApiSdk\Contracts\SdkResource Resource contract.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Client;

use Stackra\ApiSdk\Contracts\ApiClientInterface;
use Stackra\ApiSdk\Contracts\SdkResource;
use Stackra\ApiSdk\Registry\SdkResourceRegistry;

/**
 * Default `ApiClientInterface` implementation. Immutable and
 * thread-safe (Octane-safe).
 */
final readonly class ApiClient implements ApiClientInterface
{
    /**
     * @param  SdkResourceRegistry  $registry  Registry populated at boot by the discovery pass.
     */
    public function __construct(
        private SdkResourceRegistry $registry,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resource(string $name): SdkResource
    {
        return $this->registry->get($name);
    }

    /**
     * {@inheritDoc}
     */
    public function registry(): SdkResourceRegistry
    {
        return $this->registry;
    }

    /**
     * Dispatch `$api->{$name}()` into the registry.
     *
     * @param  array<int|string, mixed>  $args  Currently ignored; reserved for future extension (e.g. context-scoped resources).
     */
    public function __call(string $name, array $args): SdkResource
    {
        return $this->registry->get($name);
    }

    /**
     * Dispatch property-access (`$api->tenancy`) into the
     * registry — for consumers that prefer the shorter form.
     */
    public function __get(string $name): SdkResource
    {
        return $this->registry->get($name);
    }
}
