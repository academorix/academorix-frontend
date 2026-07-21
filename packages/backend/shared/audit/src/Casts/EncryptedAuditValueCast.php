<?php

declare(strict_types=1);

namespace Stackra\Audit\Casts;

use Stackra\Audit\Contracts\Services\KmsCipherInterface;
use Illuminate\Contracts\Container\BindingResolutionException;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Facade;

/**
 * Transparent KMS envelope encryption for a single model attribute.
 *
 * ## Usage
 *
 * ```php
 * protected function casts(): array
 * {
 *     return [
 *         'ssn' => EncryptedAuditValueCast::class,
 *     ];
 * }
 * ```
 *
 * At Eloquent's cast layer:
 *   - `set()` — invoked on assignment; wraps the value in ciphertext
 *     via the bound {@see KmsCipherInterface}. `null` passes through.
 *   - `get()` — invoked on retrieval; reverses the transform.
 *
 * ## Fail-soft on container absence
 *
 * The cast may run in contexts where the container isn't fully booted
 * (factories called before app boot, seeders in trial mode, Rector
 * refactoring passes). Every KMS interaction is wrapped so we return
 * the value untouched instead of dropping a fatal on the caller.
 *
 * @implements CastsAttributes<mixed, mixed>
 *
 * @category Audit
 *
 * @since    0.1.0
 */
final class EncryptedAuditValueCast implements CastsAttributes
{
    /**
     * Decrypt on read.
     *
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if ($value === null || $value === '') {
            return $value;
        }

        $cipher = $this->resolveCipher();
        if ($cipher === null) {
            // Fail-soft — no cipher bound, return the raw ciphertext.
            // The caller sees the opaque blob rather than a 500.
            return $value;
        }

        try {
            return $cipher->decrypt((string) $value);
        } catch (\Throwable) {
            // Decryption failure is a compliance signal, not a
            // caller-facing exception. Return null so the value
            // vanishes from the response instead of leaking a
            // ciphertext string.
            return null;
        }
    }

    /**
     * Encrypt on write.
     *
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if ($value === null) {
            return [$key => null];
        }

        // We only accept scalar-shaped payloads at this seam.
        // Callers that need to cipher structured values pre-serialise
        // them to JSON.
        $plaintext = \is_scalar($value) ? (string) $value : (string) \json_encode(
            $value,
            \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES,
        );

        $cipher = $this->resolveCipher();
        if ($cipher === null) {
            // Fail-soft — no cipher bound, persist the plaintext so
            // the write path doesn't crash. Operators see the
            // unencrypted value in the DB and can rerun a backfill
            // once a real cipher is bound.
            return [$key => $plaintext];
        }

        return [$key => $cipher->encrypt($plaintext)];
    }

    /**
     * Resolve the bound cipher without forcing a container-boot
     * exception on the caller.
     */
    private function resolveCipher(): ?KmsCipherInterface
    {
        try {
            $app = Facade::getFacadeApplication();
        } catch (\Throwable) {
            return null;
        }

        if ($app === null || ! $app->bound(KmsCipherInterface::class)) {
            return null;
        }

        try {
            /** @var KmsCipherInterface $cipher */
            $cipher = $app->make(KmsCipherInterface::class);
            return $cipher;
        } catch (BindingResolutionException) {
            return null;
        }
    }
}
