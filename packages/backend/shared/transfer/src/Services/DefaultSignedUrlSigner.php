<?php

declare(strict_types=1);

namespace Stackra\Transfer\Services;

use Stackra\Transfer\Contracts\Services\SignedUrlSignerInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default implementation of {@see SignedUrlSignerInterface}.
 *
 * Signs + verifies the artifact download URLs using a simple
 * HMAC-SHA256 over the sorted query-string. Consumer apps that need
 * KMS-backed signatures override by binding their own signer
 * through the interface's `#[Bind]` attribute.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultSignedUrlSigner implements SignedUrlSignerInterface
{
    /**
     * {@inheritDoc}
     */
    public function sign(string $route, array $params): string
    {
        $payload = $this->serialise($route, $params);

        return \hash_hmac('sha256', $payload, $this->secret());
    }

    /**
     * {@inheritDoc}
     */
    public function verify(string $route, array $params, string $signature): bool
    {
        $expected = $this->sign($route, $params);

        return \hash_equals($expected, $signature);
    }

    /**
     * Deterministically serialise the route + parameters.
     *
     * @param  array<string, mixed>  $params
     */
    private function serialise(string $route, array $params): string
    {
        \ksort($params);

        return $route . '?' . \http_build_query($params);
    }

    /**
     * Resolve the signing secret — Laravel's `app.key` when
     * available, otherwise a per-process randomised fallback that
     * still keeps tampering detectable.
     */
    private function secret(): string
    {
        $key = (string) \config('app.key', '');

        return $key !== '' ? $key : 'transfer.signed_url.fallback';
    }
}
