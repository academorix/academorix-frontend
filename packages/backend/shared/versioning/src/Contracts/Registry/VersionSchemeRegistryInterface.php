<?php

declare(strict_types=1);

namespace Stackra\Versioning\Contracts\Registry;

use Stackra\Versioning\Registry\VersionSchemeRegistry;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

/**
 * Registry of every scheme adapter the app boots with.
 *
 * Populated at boot by
 * {@see \Stackra\Versioning\Bootstrappers\VersionSchemeDiscoveryBootstrapper}
 * with the two shipped schemes (`semver`, `calver`) and by any
 * additional schemes a consumer app registers.
 *
 * Bound `#[Singleton]` — the catalogue is a pure function of the boot
 * pass, safe to share across the worker pool.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Bind(VersionSchemeRegistry::class)]
#[Singleton]
interface VersionSchemeRegistryInterface
{
    /**
     * Register a scheme by name.
     *
     * @param  string        $name       Scheme identifier persisted on `api_versions.scheme`.
     * @param  class-string  $className  FQCN of the scheme adapter.
     */
    public function register(string $name, string $className): void;

    /**
     * Resolve a scheme by name to its adapter instance.
     *
     * @throws \Stackra\Versioning\Exceptions\UnknownVersionSchemeException  When `$name` isn't registered.
     */
    public function resolve(string $name): VersionSchemeInterface;

    /**
     * Every registered scheme name and its adapter FQCN.
     *
     * @return array<string, class-string<VersionSchemeInterface>>
     */
    public function all(): array;
}
