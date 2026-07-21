<?php

declare(strict_types=1);

namespace Stackra\Transfer\Services;

use Stackra\Transfer\Attributes\Exportable;
use Stackra\Transfer\Attributes\Importable;
use Stackra\Transfer\Attributes\SampleData;
use Stackra\Transfer\Contracts\Services\EntityRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory implementation of {@see EntityRegistryInterface}.
 *
 * Hydrated at boot by the framework's generic hydration pump
 * ({@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom]` declarations on {@see EntityRegistryInterface::register()}.
 *
 * `#[Singleton]` because the registry is a pure function of the
 * composer manifest — same output every boot, safely shared across
 * every request under Octane.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Singleton]
final class EntityRegistry implements EntityRegistryInterface
{
    /**
     * Importable entities — entity key => model class.
     *
     * @var array<string, class-string>
     */
    private array $importable = [];

    /**
     * Exportable entities — entity key => model class.
     *
     * @var array<string, class-string>
     */
    private array $exportable = [];

    /**
     * Sampleable entities — entity key => model class.
     *
     * @var array<string, class-string>
     */
    private array $sampleable = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, Importable|Exportable|SampleData $attribute): void
    {
        // Dispatch each attribute variant into its bucket. Idempotent
        // — the same (className, key) pair overwrites, matching the
        // "last one wins" convention we use for every hydration
        // registry.
        match (true) {
            $attribute instanceof Importable => $this->importable[$attribute->entityKey] = $className,
            $attribute instanceof Exportable => $this->exportable[$attribute->entityKey] = $className,
            $attribute instanceof SampleData => $this->sampleable[$attribute->entityKey] = $className,
        };
    }

    /**
     * {@inheritDoc}
     */
    public function importableKeys(): array
    {
        return \array_keys($this->importable);
    }

    /**
     * {@inheritDoc}
     */
    public function exportableKeys(): array
    {
        return \array_keys($this->exportable);
    }

    /**
     * {@inheritDoc}
     */
    public function sampleableKeys(): array
    {
        return \array_keys($this->sampleable);
    }

    /**
     * {@inheritDoc}
     */
    public function importableModel(string $entityKey): ?string
    {
        return $this->importable[$entityKey] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function exportableModel(string $entityKey): ?string
    {
        return $this->exportable[$entityKey] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function clear(): void
    {
        $this->importable = [];
        $this->exportable = [];
        $this->sampleable = [];
    }
}
