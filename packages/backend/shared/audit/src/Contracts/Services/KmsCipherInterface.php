<?php

declare(strict_types=1);

namespace Stackra\Audit\Contracts\Services;

use Stackra\Audit\Services\NullKmsCipher;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

/**
 * Envelope-encryption façade over whatever KMS the deploy is wired to
 * (AWS KMS, HashiCorp Vault, GCP KMS, plain Laravel Crypt for dev).
 *
 * The default {@see NullKmsCipher} routes through Laravel's `Crypt`
 * facade — good enough for dev + tests. Production deploys bind a
 * concrete implementation via `#[Bind(KmsCipherInterface::class)]` on
 * a class that talks to a real KMS backend.
 *
 * Bound `#[Singleton]` — cipher clients are typically HTTP/gRPC
 * connection wrappers that pool their own transport; sharing one
 * across requests amortises the connection cost.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Bind(NullKmsCipher::class)]
#[Singleton]
interface KmsCipherInterface
{
    /**
     * Encrypt a plaintext string for at-rest storage.
     *
     * @param  string  $plaintext  UTF-8 string to cipher. Callers
     *   pre-serialise structured values to JSON.
     * @return string              Ciphertext — opaque to the caller.
     *   Ordering, format, and framing are the implementation's
     *   concern; consumers only ever round-trip through decrypt().
     */
    public function encrypt(string $plaintext): string;

    /**
     * Decrypt a ciphertext string previously produced by
     * {@see self::encrypt()}.
     *
     * @param  string  $ciphertext  Opaque cipher blob.
     * @return string               The original plaintext.
     *
     * @throws \RuntimeException  When the ciphertext is corrupt, was
     *   produced under a different key, or the KMS backend rejected
     *   the decrypt call.
     */
    public function decrypt(string $ciphertext): string;
}
