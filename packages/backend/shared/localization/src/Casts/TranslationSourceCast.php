<?php

declare(strict_types=1);

namespace Academorix\Localization\Casts;

use Academorix\Localization\Enums\TranslationSource;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Cast for the {@see TranslationSource} enum. Preserves the
 * backing-value string in the DB while restoring the enum on read.
 *
 * @implements CastsAttributes<TranslationSource|null, string|null>
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationSourceCast implements CastsAttributes
{
    /**
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?TranslationSource
    {
        if ($value === null) {
            return null;
        }

        return TranslationSource::tryFrom((string) $value);
    }

    /**
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof TranslationSource) {
            return $value->value;
        }

        return TranslationSource::tryFrom((string) $value)?->value;
    }
}
