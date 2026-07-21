<?php

declare(strict_types=1);

namespace Stackra\Transfer\Attributes;

use Attribute;

/**
 * Marks an Eloquent model as importable via the transfer engine.
 *
 * Discovered at boot by the framework's generic hydration pump
 * ({@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom(Importable::class)]` declaration on
 * {@see \Stackra\Transfer\Contracts\Services\EntityRegistryInterface::register()}.
 *
 * ## Example
 *
 * ```php
 * #[Importable(
 *     entityKey: 'athletes',
 *     label: 'Athletes',
 *     modes: [ImportMode::Append, ImportMode::Upsert],
 *     formats: [ImportFormat::Xlsx, ImportFormat::Csv],
 *     requiredPermission: 'athletes.import',
 *     chunkSize: 500,
 *     uniqueBy: ['email'],
 * )]
 * final class Athlete extends Model
 * {
 *     use HasImportable;
 * }
 * ```
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class Importable
{
    /**
     * @param  string        $entityKey           Stable machine-readable key (e.g. `athletes`).
     * @param  string|null   $label               Human-readable UI label. Falls back to model short name when null.
     * @param  list<string>  $modes               Backing values of allowed `ImportMode` cases.
     * @param  list<string>  $formats             Backing values of allowed `ImportFormat` cases.
     * @param  string|null   $requiredPermission  Per-entity permission composed with `transfer.imports.run`.
     * @param  int|null      $chunkSize           Override for `config('transfer.import.chunk_size')`.
     * @param  int|null      $batchSize           Override for `config('transfer.import.batch_size')`.
     * @param  list<string>  $uniqueBy            Column names used for upsert / delete matching.
     * @param  bool          $sharded             Whether the entity opts into sharded imports.
     */
    public function __construct(
        public string $entityKey,
        public ?string $label = null,
        public array $modes = [],
        public array $formats = [],
        public ?string $requiredPermission = null,
        public ?int $chunkSize = null,
        public ?int $batchSize = null,
        public array $uniqueBy = [],
        public bool $sharded = false,
    ) {
    }
}
