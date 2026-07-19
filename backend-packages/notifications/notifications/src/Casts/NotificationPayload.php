<?php

declare(strict_types=1);

namespace Academorix\Notifications\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Cast the `notifications.payload` JSONB column between PHP array
 * and JSON string.
 *
 * Encapsulates the encode/decode boilerplate + defaults to `[]` on
 * hydrate when the column is `null` — the dispatch gateway relies
 * on a stable array shape.
 *
 * @category Notifications
 *
 * @since    0.1.0
 *
 * @implements CastsAttributes<array<string, mixed>, array<string, mixed>>
 */
final class NotificationPayload implements CastsAttributes
{
    /**
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        if (\is_array($value)) {
            /** @var array<string, mixed> $value */
            return $value;
        }

        /** @var array<string, mixed>|null $decoded */
        $decoded = \json_decode((string) $value, true);

        return \is_array($decoded) ? $decoded : [];
    }

    /**
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        if ($value === null) {
            return '{}';
        }

        return (string) \json_encode($value);
    }
}
