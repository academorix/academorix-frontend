<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Casts;

use Stackra\Newsletter\Enums\NewsletterCadence;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Cast for the newsletter cadence column.
 *
 * Coerces raw string values into the {@see NewsletterCadence} enum
 * on hydrate and back to the enum's backing value on save. Unknown
 * strings fall back to {@see NewsletterCadence::Manual} — safer
 * than throwing on a schema-drift case, since manual cadence is
 * the do-nothing default.
 *
 * @implements CastsAttributes<NewsletterCadence, NewsletterCadence|string|null>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterCadenceCast implements CastsAttributes
{
    /**
     * Cast raw storage value → enum instance on read.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): NewsletterCadence
    {
        if ($value instanceof NewsletterCadence) {
            return $value;
        }

        return NewsletterCadence::tryFrom((string) $value) ?? NewsletterCadence::Manual;
    }

    /**
     * Cast enum instance → raw storage value on write.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        if ($value instanceof NewsletterCadence) {
            return $value->value;
        }

        $cadence = NewsletterCadence::tryFrom((string) $value) ?? NewsletterCadence::Manual;

        return $cadence->value;
    }
}
