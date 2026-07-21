<?php

declare(strict_types=1);

namespace Stackra\Audit\Services;

use Stackra\Audit\Contracts\Services\KmsCipherInterface;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Contracts\Encryption\Encrypter;

/**
 * Fallback {@see KmsCipherInterface} that routes through Laravel's
 * bound {@see Encrypter}.
 *
 * Good enough for dev + tests. Production apps override via
 * `#[Bind(KmsCipherInterface::class)]` on a class that talks to a
 * real KMS backend (AWS KMS, Vault, GCP KMS).
 *
 * The "Null" prefix mirrors the codebase's fail-soft default naming
 * (`NullDomainVerifier`, `NullCertificateProvisioner`, ...) — not
 * "does nothing", but "safe stand-in until a consumer app binds a
 * real backend".
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullKmsCipher implements KmsCipherInterface
{
    public function __construct(
        private readonly Encrypter $encrypter,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function encrypt(string $plaintext): string
    {
        // Laravel's Encrypter emits an authenticated ciphertext
        // (AES-256-CBC or -GCM depending on config). `false` disables
        // the serialize step — we accept plain strings only, so
        // storing PHP-serialised blobs would be a footgun.
        return $this->encrypter->encrypt($plaintext, false);
    }

    /**
     * {@inheritDoc}
     */
    public function decrypt(string $ciphertext): string
    {
        try {
            return (string) $this->encrypter->decrypt($ciphertext, false);
        } catch (DecryptException $e) {
            // Rethrow as a generic runtime error so the cast layer
            // can catch a portable exception type rather than a
            // Laravel-specific one. Preserves the original as
            // `previous` for observability.
            throw new \RuntimeException(
                'Audit cipher decryption failed: ' . $e->getMessage(),
                previous: $e,
            );
        }
    }
}
