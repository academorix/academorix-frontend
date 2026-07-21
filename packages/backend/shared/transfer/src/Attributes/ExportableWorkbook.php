<?php

declare(strict_types=1);

namespace Stackra\Transfer\Attributes;

use Attribute;

/**
 * Marks a class as an exportable multi-sheet workbook — a container
 * that emits several `#[Exportable]` models onto separate sheets of
 * a single output file.
 *
 * Discovered at boot by the framework's generic hydration pump via
 * the `#[HydratesFrom(ExportableWorkbook::class)]` declaration on
 * {@see \Stackra\Transfer\Contracts\Services\WorkbookRegistryInterface::register()}.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class ExportableWorkbook
{
    /**
     * @param  string                     $workbookKey  Stable machine-readable identifier.
     * @param  string|null                $label        Human-readable UI label.
     * @param  array<string, class-string> $sheets      Sheet name → source Eloquent model.
     */
    public function __construct(
        public string $workbookKey,
        public ?string $label = null,
        public array $sheets = [],
    ) {
    }
}
