<?php

declare(strict_types=1);

namespace Academorix\Transfer\Casts;

use Academorix\Transfer\Enums\ExportFormat;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent cast for the `xfer_jobs.format` column (export side).
 *
 * @implements CastsAttributes<ExportFormat, ExportFormat|string>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class ExportFormatCast implements CastsAttributes
{
    /**
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?ExportFormat
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $value instanceof ExportFormat ? $value : ExportFormat::tryFrom((string) $value);
    }

    /**
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        return $value instanceof ExportFormat ? $value->value : (string) $value;
    }
}
