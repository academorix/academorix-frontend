<?php

declare(strict_types=1);

namespace Stackra\Transfer\Registry;

use Stackra\Transfer\Attributes\ExportableWorkbook;
use Stackra\Transfer\Attributes\ImportableWorkbook;
use Stackra\Transfer\Contracts\Registry\WorkbookRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory implementation of {@see WorkbookRegistryInterface}.
 *
 * Registered at boot by the framework hydration pump.
 * `#[Singleton]` — pure function of the composer manifest.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Singleton]
final class WorkbookRegistry implements WorkbookRegistryInterface
{
    /**
     * @var array<string, class-string>
     */
    private array $importable = [];

    /**
     * @var array<string, class-string>
     */
    private array $exportable = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, ImportableWorkbook|ExportableWorkbook $attribute): void
    {
        match (true) {
            $attribute instanceof ImportableWorkbook => $this->importable[$attribute->workbookKey] = $className,
            $attribute instanceof ExportableWorkbook => $this->exportable[$attribute->workbookKey] = $className,
        };
    }

    /**
     * {@inheritDoc}
     */
    public function importableWorkbooks(): array
    {
        return \array_keys($this->importable);
    }

    /**
     * {@inheritDoc}
     */
    public function exportableWorkbooks(): array
    {
        return \array_keys($this->exportable);
    }

    /**
     * {@inheritDoc}
     */
    public function clear(): void
    {
        $this->importable = [];
        $this->exportable = [];
    }
}
