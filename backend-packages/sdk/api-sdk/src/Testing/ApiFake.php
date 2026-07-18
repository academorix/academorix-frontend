<?php

/**
 * @file packages/sdk/api-sdk/src/Testing/ApiFake.php
 *
 * @description
 * Test double implementing {@see \Academorix\ApiSdk\Contracts\ApiClientInterface}.
 * Consumers bind the fake in tests via
 * `$this->app->bind(ApiClientInterface::class, ApiFake::class)`
 * (Laravel) or `config(['sdk.api.fake' => true])` (which
 * `ApiSdkServiceProvider` reads at boot).
 *
 * ## Usage pattern
 *
 * ```php
 * beforeEach(function () {
 *     config(['sdk.api.fake' => true]);
 * });
 *
 * it('fetches the tenant via the SDK', function () {
 *     $api = app(ApiClientInterface::class);
 *     assert($api instanceof ApiFake);
 *
 *     $api->stub('tenancy', new class extends BaseSdkResource {
 *         public function find(string $id): TenantData {
 *             return TenantData::from(['id' => $id, 'name' => 'Acme']);
 *         }
 *     });
 *
 *     expect($api->tenancy()->find('01H...'))
 *         ->id->toBe('01H...');
 * });
 * ```
 *
 * ## Assertions
 *
 * The fake doesn't record calls out of the box — resources
 * passed to `stub()` are consulted directly. Consumers wanting
 * call recording should use Mockery or Pest's `spy()` on the
 * stubbed resource instances.
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Testing;

use Academorix\ApiSdk\Contracts\ApiClientInterface;
use Academorix\ApiSdk\Contracts\SdkResource;
use Academorix\ApiSdk\Registry\SdkResourceRegistry;

/**
 * In-memory fake ApiClient — no HTTP, no Saloon, no network.
 */
final class ApiFake implements ApiClientInterface
{
    /**
     * Private registry that only contains stubbed resources.
     */
    private SdkResourceRegistry $registry;

    public function __construct()
    {
        $this->registry = new SdkResourceRegistry();
    }

    /**
     * Register a stub for a resource name. Overwrites any
     * existing stub under the same name.
     */
    public function stub(string $name, SdkResource $resource): void
    {
        $this->registry->register($name, $resource);
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
     * Magic dispatch — identical to the real client.
     *
     * @param  array<int|string, mixed>  $args  Ignored.
     */
    public function __call(string $name, array $args): SdkResource
    {
        return $this->registry->get($name);
    }

    /**
     * Property access — identical to the real client.
     */
    public function __get(string $name): SdkResource
    {
        return $this->registry->get($name);
    }
}
