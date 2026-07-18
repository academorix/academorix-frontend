<?php

declare(strict_types=1);

namespace Academorix\Notifications\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Cast the quiet-hours window between a normalised `HH:MM` pair and
 * the stored representation.
 *
 * Ensures every persisted value is a canonical `HH:MM` string —
 * defensive against callers who pass just `H` or `H:MM` shapes.
 *
 * @category Notifications
 *
 * @since    0.1.0
 *
 * @implements CastsAttributes<string, string>
 */
final class QuietHours implements CastsAttributes
{
    /**
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $this->normalise((string) $value);
    }

    /**
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $this->normalise((string) $value);
    }

    /**
     * Coerce an input string to a canonical `HH:MM` shape. Falls back
     * to the input value verbatim when parsing fails so validators
     * upstream surface the error rather than silent data loss.
     */
    private function normalise(string $value): string
    {
        if (\preg_match('/^(\d{1,2}):(\d{2})$/', $value, $matches) !== 1) {
            return $value;
        }

        $hour   = (int) $matches[1];
        $minute = (int) $matches[2];

        return \sprintf('%02d:%02d', $hour, $minute);
    }
}
