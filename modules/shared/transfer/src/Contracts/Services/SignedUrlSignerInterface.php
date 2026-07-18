<?php

declare(strict_types=1);

namespace Academorix\Transfer\Contracts\Services;

use Academorix\Transfer\Services\DefaultSignedUrlSigner;
use Illuminate\Container\Attributes\Bind;

/**
 * Builds + verifies signed URLs for artifact downloads.
 *
 * The signing algorithm is deliberately abstracted behind this
 * interface — consumer apps that need a custom signature scheme
 * (KMS-backed HMAC, per-tenant secret rotation) override by binding
 * their own concrete through this interface's `#[Bind]`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(DefaultSignedUrlSigner::class)]
interface SignedUrlSignerInterface
{
    /**
     * Build a signed download URL that expires after
     * `config('transfer.signed_url.ttl_minutes')`.
     *
     * @param  array<string, mixed>  $params  Query-string parameters to sign.
     */
    public function sign(string $route, array $params): string;

    /**
     * Verify the request-supplied signature. Returns `true` when the
     * signature is intact + within its TTL.
     *
     * @param  array<string, mixed>  $params
     */
    public function verify(string $route, array $params, string $signature): bool;
}
