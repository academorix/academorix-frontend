<?php

declare(strict_types=1);

namespace Stackra\Transfer\Attributes;

use Attribute;

/**
 * Marks an Eloquent model as exportable via the transfer engine.
 *
 * Discovered at boot by the framework's generic hydration pump
 * ({@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom(Exportable::class)]` declaration on
 * {@see \Stackra\Transfer\Contracts\Services\EntityRegistryInterface::register()}.
 *
 * ## Example
 *
 * ```php
 * #[Exportable(
 *     entityKey: 'athletes',
 *     label: 'Athletes',
 *     formats: [ExportFormat::Xlsx, ExportFormat::Csv, ExportFormat::Pdf],
 *     requiredPermission: 'athletes.export',
 *     syncThreshold: 5000,
 *     chunkSize: 1000,
 * )]
 * final class Athlete extends Model
 * {
 *     use HasExportable;
 * }
 * ```
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class Exportable
{
    /**
     * @param  string        $entityKey           Stable machine-readable key (matches the Importable key when both are set).
     * @param  string|null   $label               Human-readable UI label.
     * @param  list<string>  $formats             Backing values of allowed `ExportFormat` cases.
     * @param  string|null   $requiredPermission  Per-entity permission composed with `transfer.exports.run`.
     * @param  int|null      $syncThreshold       Row-count ceiling for the inline `/exports/stream` path.
     * @param  int|null      $chunkSize           Override for `config('transfer.export.chunk_size')`.
     */
    public function __construct(
        public string $entityKey,
        public ?string $label = null,
        public array $formats = [],
        public ?string $requiredPermission = null,
        public ?int $syncThreshold = null,
        public ?int $chunkSize = null,
    ) {
    }
}
