<?php

declare(strict_types=1);

namespace Academorix\Versioning\Bootstrappers;

use Academorix\ServiceProvider\Attributes\AsBootstrapper;
use Academorix\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Academorix\Versioning\Contracts\Services\VersionSchemeRegistryInterface;
use Academorix\Versioning\Enums\VersionScheme;
use Academorix\Versioning\Schemes\CalVerScheme;
use Academorix\Versioning\Schemes\SemVerScheme;
use Illuminate\Container\Attributes\Singleton;

/**
 * Register the two shipped {@see \Academorix\Versioning\Contracts\Services\VersionSchemeInterface}
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
