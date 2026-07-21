<?php

declare(strict_types=1);

namespace Stackra\Versioning\Bootstrappers;

use Stackra\ServiceProvider\Attributes\AsBootstrapper;
use Stackra\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Stackra\Versioning\Contracts\Services\VersionSchemeRegistryInterface;
use Stackra\Versioning\Enums\VersionScheme;
use Stackra\Versioning\Schemes\CalVerScheme;
use Stackra\Versioning\Schemes\SemVerScheme;
use Illuminate\Container\Attributes\Singleton;

/**
 * Register the two shipped {@see \Stackra\Versioning\Contracts\Services\VersionSchemeInterface}
 * adapters (`semver` -> {@see SemVerScheme}, `calver` -> {@see CalVerScheme})
 * with the {@see VersionSchemeRegistryInterface}.
 *
 * Escape-hatch bootstrapper — the shipped schemes are not attribute-
 * scanned, they are hardcoded here so the module boots with a working
 * catalogue even before consumer apps declare custom schemes. Custom
 * consumer schemes register through a separate bootstrapper or via
 * the registry's `register()` API.
 *
 * ## Priority
 *
 * `120` — inside the domain-modules band (100..199). No dependency on
 * other domain bootstrappers; the registry it hydrates is a fresh
 * singleton per boot.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsBootstrapper(priority: 120)]
#[Singleton]
final class VersionSchemeDiscoveryBootstrapper extends AbstractBootstrapper
{
    public function __construct(
        private readonly VersionSchemeRegistryInterface $registry,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'versioning.version-schemes';
    }

    /**
     * {@inheritDoc}
     */
    public function priority(): int
    {
        return 120;
    }

    /**
     * {@inheritDoc}
     *
     * Wire the two shipped schemes. Idempotent — re-running against a
     * pre-populated registry overwrites the entries with the same
     * values.
     */
    public function populate(): void
    {
        $this->registry->register(VersionScheme::SemVer->value, SemVerScheme::class);
        $this->registry->register(VersionScheme::CalVer->value, CalVerScheme::class);
    }
}
