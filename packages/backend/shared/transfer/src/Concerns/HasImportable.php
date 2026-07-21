<?php

declare(strict_types=1);

namespace Stackra\Transfer\Concerns;

/**
 * Opt-in trait for models registering with the import pipeline.
 *
 * Composes with the paired `#[Importable]` attribute + optional
 * `#[ImportField]` / `#[TransferField]` class-level attributes.
 * The attribute alone drives EntityRegistry discovery; this trait
 * carries the runtime accessors the import pipeline needs.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
trait HasImportable
{
    /**
     * Return the eloquent query scope used for import lookups
     * (unique-by matching, replace-mode delete). Consumers override
     * to further constrain the base scope (e.g. exclude archived
     * rows).
     */
    public function importScope(): \Illuminate\Database\Eloquent\Builder
    {
        return static::query();
    }

    /**
     * Return the runtime schema hints — a map of column name → PHP
     * type / accessor / cast — used when the attribute-declared
     * `#[ImportField]` set needs to be augmented dynamically.
     *
     * @return array<string, mixed>
     */
    public function importSchema(): array
    {
        return [];
    }
}
