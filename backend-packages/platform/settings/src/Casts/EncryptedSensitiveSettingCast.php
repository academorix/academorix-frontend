<?php

declare(strict_types=1);

namespace Academorix\Settings\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

/**
 * Cast for the `value` column on {@see \Academorix\Settings\Models\SettingValue}.
 *
 * Applied when the owning `SettingsSchema` flags `sensitive: true`
 * AND `config('settings.encrypt_sensitive_at_rest')` is on.
 * Encrypts using Laravel's `Crypt` facade under the hood — swap for a
 * KMS-backed implementation in an enterprise deployment by binding a
 * different cast class.
 *
 * When the sensitive flag is off, the cast is a passthrough so
 * mixed-sensitivity groups don't pay the encrypt/decrypt cost on
 * non-sensitive rows.
 *
 * @implements CastsAttributes<mixed, mixed>
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final class EncryptedSensitiveSettingCast implements CastsAttributes
{
    /**
     * Decrypt on read.
     *
     * @param  Model                $model
     * @param  string               $key
     * @param  mixed                $value    Raw column value.
     * @param  array<string, mixed> $attributes
     * @return mixed  Decoded, possibly-decrypted value.
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if ($value === null) {
            return null;
        }

        if (! $this->shouldEncrypt()) {
            return \is_string($value) ? \json_decode($value, true) : $value;
        }

        try {
            $decrypted = Crypt::decryptString((string) $value);
        } catch (\Throwable) {
            // Row was written before encryption was enabled — return raw.
            return \is_string($value) ? \json_decode($value, true) : $value;
        }

        return \json_decode($decrypted, true);
    }

    /**
     * Encrypt on write.
     *
     * @param  Model                $model
     * @param  string               $key
     * @param  mixed                $value    New value.
     * @param  array<string, mixed> $attributes
     * @return string|null  Column-ready payload.
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $encoded = \json_encode($value);
        if ($encoded === false) {
            $encoded = '';
        }

        if (! $this->shouldEncrypt()) {
            return $encoded;
        }

        return Crypt::encryptString($encoded);
    }

    /**
     * Whether the platform is configured to encrypt sensitive values.
     */
    private function shouldEncrypt(): bool
    {
        try {
            return (bool) \config('settings.encrypt_sensitive_at_rest', false);
        } catch (\Throwable) {
            return false;
        }
    }
}
