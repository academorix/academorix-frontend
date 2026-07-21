<?php

declare(strict_types=1);

namespace Stackra\Versioning\Services;

use Stackra\Versioning\Contracts\Services\VersionSchemeInterface;
use Stackra\Versioning\Contracts\Services\VersionSchemeRegistryInterface;
use Stackra\Versioning\Exceptions\UnknownVersionSchemeException;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory {@see VersionSchemeRegistryInterface}.
 *
 * Populated at boot by
 * {@see \Stackra\Versioning\Bootstrappers\VersionSchemeDiscoveryBootstrapper}
 * with the two shipped schemes. Consumer apps register additional
 * schemes via a `#[Bind]` on their own concrete + a call to
 * `register()` inside a bootstrapper.
 *
 * `#[Singleton]` — the catalogue is process-lifetime.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Singleton]
final class VersionSchemeRegistry implements VersionSchemeRegistryInterface
{
    /**
     * Name -> scheme adapter FQCN.
     *
     * @var array<string, class-string<VersionSchemeInterface>>
     */
    private array $entries = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $name, string $className): void
    {
        /** @var class-string<VersionSchemeInterface> $className */
        $this->entries[$name] = $className;
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(string $name): VersionSchemeInterface
    {
        if (! isset($this->entries[$name])) {
            throw new UnknownVersionSchemeException(\sprintf(
                'Unknown version scheme "%s".',
                $name,
            ));
        }

        /** @var VersionSchemeInterface $instance */
        $instance = \app($this->entries[$name]);

        return $instance;
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->entries;
    }
}
