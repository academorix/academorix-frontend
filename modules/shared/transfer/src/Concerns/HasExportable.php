<?php

declare(strict_types=1);

namespace Academorix\Transfer\Concerns;

/**
 * Opt-in trait for models registering with the export pipeline.
 *
 * Composes with the paired `#[Exportable]` attribute + optional
 * `#[ExportField]` / `#[TransferField]` class-level attributes.
 * The attribute alone drives EntityRegistry discovery; this trait
 * carries the runtime accessors the export pipeline needs.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
trait HasExportable
{
    /**
     * Return the eloquent query scope used for exports. Consumers
     * override to constrain the base scope (e.g. `->active()`).
     */
    public function exportScope(): \Illuminate\Database\Eloquent\Builder
    {
        return static::query();
    }

    /**
     * Return the runtime schema hints — a map of column name →
     * accessor / format / cast — used when the attribute-declared
     * `#[ExportField]` set needs to be augmented dynamically.
     *
     * @return array<string, mixed>
     */
    public function exportSchema(): array
    {
        return [];
    }
}
