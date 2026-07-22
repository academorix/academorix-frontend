<?php

declare(strict_types=1);

namespace Stackra\Transfer\Contracts\Registry;

use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Stackra\Transfer\Attributes\ExportableWorkbook;
use Stackra\Transfer\Attributes\ImportableWorkbook;
use Stackra\Transfer\Registry\WorkbookRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * Registry of every class carrying `#[ImportableWorkbook]` or
 * `#[ExportableWorkbook]` — multi-sheet workbooks that a single
 * file operation drives.
 *
 * Hydrated at boot by the framework's generic hydration pump via
 * the `#[HydratesFrom]` attributes on {@see register()}.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(WorkbookRegistry::class)]
interface WorkbookRegistryInterface
{
    /**
     * Register a workbook class. Idempotent.
     *
     * @param  class-string                                $className  FQCN of the workbook class.
     * @param  ImportableWorkbook|ExportableWorkbook       $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(ImportableWorkbook::class, priority: 120)]
    #[HydratesFrom(ExportableWorkbook::class, priority: 120)]
    public function register(string $className, ImportableWorkbook|ExportableWorkbook $attribute): void;

    /**
     * All registered importable workbook keys.
     *
     * @return list<string>
     */
    public function importableWorkbooks(): array;

    /**
     * All registered exportable workbook keys.
     *
     * @return list<string>
     */
    public function exportableWorkbooks(): array;

    /**
     * Reset the registry — used by tests between fixtures.
     */
    public function clear(): void;
}
