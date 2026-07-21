<?php

declare(strict_types=1);

namespace Stackra\Webhook\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Plain JSON cast for `webhook_subscriptions.backoff_config`.
 *
 * Backoff config carries no secrets (schedules of seconds, fallback
 * arrays) so this cast is a straight JSON encode/decode. Kept as a
 * named cast so upgrading it to an encrypted variant is a one-file
 * change.
 *
 * @category Webhook
 *
 * @since    0.1.0
 *
 * @implements CastsAttributes<array<string, mixed>|null, array<string, mixed>|null>
 */
final class BackoffConfigCast implements CastsAttributes
{
    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>|null
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        if ($value === null || $value === '' || $value === '[]') {
            return null;
        }

        /** @var array<string, mixed>|null $decoded */
        $decoded = \json_decode((string) $value, associative: true);

        return \is_array($decoded) ? $decoded : null;
    }

    /**
     * @param  array<string, mixed>|null  $value
     * @param  array<string, mixed>       $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $json = \json_encode($value, \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES);

        return $json === false ? null : $json;
    }
}
