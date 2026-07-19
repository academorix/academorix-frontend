<?php

declare(strict_types=1);

namespace Academorix\Localization\Casts;

use Academorix\Localization\Enums\TextDirection;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Wire-friendly cast for the {@see TextDirection} enum. Present for
 * the rare column that stores direction directly (rather than
 * deriving it via the accessor chain on `PlatformLanguage`).
 *
 * @implements CastsAttributes<TextDirection|null, string|null>
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TextDirectionCast implements CastsAttributes
{
    /**
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?TextDirection
    {
        if ($value === null) {
            return null;
        }

        return TextDirection::tryFrom((string) $value);
    }

    /**
     * {@inheritDoc}
     *
     * Accepts either the enum instance OR the backing string; both
     * paths land as the enum's backing value in storage.
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof TextDirection) {
            return $value->value;
        }

        return TextDirection::tryFrom((string) $value)?->value;
    }
}
