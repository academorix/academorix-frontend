<?php

declare(strict_types=1);

namespace Academorix\Transfer\Casts;

use Academorix\Transfer\Enums\XferJobStatus;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent cast for the `xfer_jobs.status` column.
 *
 * @implements CastsAttributes<XferJobStatus, XferJobStatus|string>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferJobStatusCast implements CastsAttributes
{
    /**
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?XferJobStatus
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $value instanceof XferJobStatus ? $value : XferJobStatus::tryFrom((string) $value);
    }

    /**
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        return $value instanceof XferJobStatus ? $value->value : (string) $value;
    }
}
