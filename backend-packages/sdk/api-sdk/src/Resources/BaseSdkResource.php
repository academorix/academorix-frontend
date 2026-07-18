<?php

/**
 * @file packages/sdk/api-sdk/src/Resources/BaseSdkResource.php
 *
 * @description
 * Abstract base class every module's SDK resource extends.
 * Wires the connector once, exposes it via a protected accessor,
 * and satisfies the two `SdkResource` contract methods.
 *
 * ## Why extend this (and not directly `Saloon\Http\BaseResource`)
 *
 * Saloon's `BaseResource` requires the connector at construction
 * time. That doesn't fit the discovery pattern — the container
 * instantiates the resource first (so it can be discovered), and
 * the connector is wired afterwards. This base class inverts
 * that: default constructor, `attachConnector()` sets the field
 * later.
 *
 * Concrete resources access the connector via
 * `$this->connector()` when building a Saloon request:
 *
 * ```php
 * public function find(string $id): TenantData
 * {
 *     return $this->connector()->send(new FindTenantRequest($id))->dtoOrFail();
 * }
 * ```
 *
 * The `send()` call dispatches the request through the connector
 * (and thus through every middleware) and `dtoOrFail()` returns
 * whatever the request's `createDtoFromResponse()` produced.
 *
 * @see \Academorix\ApiSdk\Contracts\SdkResource Contract.
 * @see \Academorix\ApiSdk\Attributes\AsSdkResource Discovery marker.
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Contracts\SdkResource;
use LogicException;

/**
 * Default `SdkResource` base — resources extend this, add
 * `#[AsSdkResource(name: '...')]`, and implement their domain
 * methods.
 */
abstract class BaseSdkResource implements SdkResource
{
    /**
     * The shared connector, wired once via {@see attachConnector()}
     * during discovery. `null` until wired — resource methods
     * MUST call {@see connector()} which throws if the wiring
     * step was skipped.
     */
    private ?ApiConnector $connector = null;

    /**
     * {@inheritDoc}
     *
     * Concrete resources may override to return a constant that
     * matches their `#[AsSdkResource]::$name`. The default reads
     * the attribute reflectively — fine for one call per boot.
     */
    public function name(): string
    {
        // Read `#[AsSdkResource]::$name` reflectively as a safety
        // net for consumers that construct the resource manually
        // (in tests) and haven't overridden this method. Once
        // per class per worker; cheap.
        static $cache = [];
        $class = static::class;
        if (isset($cache[$class])) {
            return $cache[$class];
        }

        $reflection = new \ReflectionClass($class);
        $attribute  = $reflection->getAttributes(\Academorix\ApiSdk\Attributes\AsSdkResource::class);
        if ($attribute === []) {
            throw new LogicException(
                "Resource [{$class}] must carry `#[AsSdkResource(name: ...)]` "
                . 'or override `name()` explicitly.',
            );
        }

        return $cache[$class] = $attribute[0]->newInstance()->name;
    }

    /**
     * {@inheritDoc}
     *
     * Idempotent — calling twice is safe. The second call
     * overwrites the connector reference; useful in tests that
     * rebind a fake connector after boot.
     */
    public function attachConnector(ApiConnector $connector): void
    {
        $this->connector = $connector;
    }

    /**
     * Accessor for the wired connector. Throws when the
     * discovery pass hasn't wired one — that's a symptom of a
     * misconfigured provider (usually the resource being
     * instantiated manually without going through
     * `ApiSdkServiceProvider`).
     *
     * @throws LogicException When called before `attachConnector()`.
     */
    protected function connector(): ApiConnector
    {
        return $this->connector
            ?? throw new LogicException(
                'ApiConnector not attached to [' . static::class . ']. '
                . 'The resource must be resolved through ApiSdkServiceProvider so '
                . 'attachConnector() is called during discovery.',
            );
    }
}
