<?php

declare(strict_types=1);

namespace Academorix\Transfer\Casts;

use Academorix\Transfer\Enums\ImportMode;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent cast for the `xfer_jobs.mode` column.
 *
 * @implements CastsAttributes<ImportMode, ImportMode|string>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class ImportModeCast implements CastsAttributes
{
    /**
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?ImportMode
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $value instanceof ImportMode ? $value : ImportMode::tryFrom((string) $value);
    }

    /**
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        return $value instanceof ImportMode ? $value->value : (string) $value;
    }
}
