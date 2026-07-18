<?php

declare(strict_types=1);

namespace Academorix\Webhook\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

/**
 * Encrypted-at-rest cast for the `webhook_deliveries.payload` column.
 *
 * The payload is a JSON snapshot that may contain PII, so it is
 * encrypted with Laravel's application key before being persisted and
 * decrypted on hydrate. Consumers read/write it as a plain array.
 *
 * @category Webhook
 *
 * @since    0.1.0
 *
 * @implements CastsAttributes<array<string, mixed>|null, array<string, mixed>|null>
 */
final class WebhookPayloadCast implements CastsAttributes
{
    /**
     * Decrypt + JSON-decode on hydrate.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>|null
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            $decrypted = Crypt::decryptString((string) $value);
        } catch (\Throwable) {
            // Row was written without encryption (dev fixture, legacy row) —
            // fall through to a plain JSON decode.
            $decrypted = (string) $value;
        }

        /** @var array<string, mixed>|null $decoded */
        $decoded = \json_decode($decrypted, associative: true);

        return \is_array($decoded) ? $decoded : null;
    }

    /**
     * JSON-encode + encrypt on save.
     *
     * @param  array<string, mixed>|null  $value
     * @param  array<string, mixed>       $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $json = \json_encode($value, \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            return null;
        }

        return Crypt::encryptString($json);
    }
}
