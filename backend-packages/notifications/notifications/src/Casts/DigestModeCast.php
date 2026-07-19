<?php

declare(strict_types=1);

namespace Academorix\Notifications\Casts;

use Academorix\Notifications\Enums\DigestMode;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Cast the `digest_mode` column to / from the {@see DigestMode} enum.
 *
 * The model composes `#[Fillable]` with the raw column name and
 * Eloquent's enum casting handles most of the round-trip, but this
 * explicit cast is exported so consumers may opt in on custom
 * models that carry the same column shape.
 *
 * @category Notifications
 *
 * @since    0.1.0
 *
 * @implements CastsAttributes<DigestMode, DigestMode|string>
 */
final class DigestModeCast implements CastsAttributes
{
    /**
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?DigestMode
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof DigestMode) {
            return $value;
        }

        return DigestMode::tryFrom((string) $value);
    }

    /**
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof DigestMode) {
            return $value->value;
        }

        return (string) $value;
    }
}
