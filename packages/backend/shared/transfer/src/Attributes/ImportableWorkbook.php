<?php

declare(strict_types=1);

namespace Stackra\Transfer\Attributes;

use Attribute;

/**
 * Marks a class as an importable multi-sheet workbook — a container
 * that dispatches to several `#[Importable]` models based on sheet
 * name.
 *
 * Discovered at boot by the framework's generic hydration pump via
 * the `#[HydratesFrom(ImportableWorkbook::class)]` declaration on
 * {@see \Stackra\Transfer\Contracts\Registry\WorkbookRegistryInterface::register()}.
 *
 * ## Example
 *
 * ```php
 * #[ImportableWorkbook(
 *     workbookKey: 'season-setup',
 *     label: 'Season setup workbook',
 *     sheets: [
 *         'Teams'    => Team::class,
 *         'Athletes' => Athlete::class,
 *         'Coaches'  => Coach::class,
 *     ],
 * )]
 * final class SeasonSetupWorkbook {}
 * ```
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class ImportableWorkbook
{
    /**
     * @param  string                     $workbookKey  Stable machine-readable identifier.
     * @param  string|null                $label        Human-readable UI label.
     * @param  array<string, class-string> $sheets      Sheet name → target Eloquent model.
     */
    public function __construct(
        public string $workbookKey,
        public ?string $label = null,
        public array $sheets = [],
    ) {
    }
}
