<?php

declare(strict_types=1);

namespace Stackra\Transfer\Casts;

use Stackra\Transfer\Enums\ImportFormat;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent cast for the `xfer_jobs.format` column (import side).
 *
 * @implements CastsAttributes<ImportFormat, ImportFormat|string>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class ImportFormatCast implements CastsAttributes
{
    /**
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?ImportFormat
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $value instanceof ImportFormat ? $value : ImportFormat::tryFrom((string) $value);
    }

    /**
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        return $value instanceof ImportFormat ? $value->value : (string) $value;
    }
}
