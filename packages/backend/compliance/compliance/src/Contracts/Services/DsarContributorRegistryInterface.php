<?php

declare(strict_types=1);

namespace Stackra\Compliance\Contracts\Services;

use Stackra\Compliance\Attributes\DsarExportable;
use Stackra\Compliance\Services\DefaultDsarContributorRegistry;
use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;

/**
 * In-memory registry of every `#[DsarExportable]` model.
 *
 * Hydrated at boot by the framework's generic hydration pump.
 * Consumers of the DSAR orchestrator iterate the registry to
 * assemble a subject's export bundle.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(DefaultDsarContributorRegistry::class)]
interface DsarContributorRegistryInterface
{
    /**
     * Register a `#[DsarExportable]` model.
     *
     * @param  class-string    $className  FQCN of the model.
     * @param  DsarExportable  $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(DsarExportable::class)]
    public function register(string $className, DsarExportable $attribute): void;

    /**
     * Every registered contributor, sorted by declared priority
     * ascending.
     *
     * @return list<array{class: class-string, attribute: DsarExportable}>
     */
    public function all(): array;

    /**
     * Whether a specific class is registered.
     *
     * @param  class-string  $className  FQCN to check.
     */
    public function has(string $className): bool;
}
