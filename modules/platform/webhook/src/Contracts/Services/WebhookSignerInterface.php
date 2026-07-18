<?php

declare(strict_types=1);

namespace Academorix\Webhook\Contracts\Services;

use Academorix\Webhook\Services\HmacSha256Signer;
use Illuminate\Container\Attributes\Bind;

/**
 * HMAC signer for outbound webhook payloads.
 *
 * The default implementation
 * ({@see HmacSha256Signer}) produces
 * `hex(hmac_sha256(timestamp + '.' + event + '.' + payload, secret))`
 * per the blueprint signing spec. Consumer apps may bind a stronger
 * algorithm (Ed25519, HMAC-SHA512) by overriding the binding.
 *
 * `#[Bind(HmacSha256Signer::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". Consumers
 * override with `#[Overrides(WebhookSignerInterface::class)]` on
 * their own concrete when swapping the algorithm.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Bind(HmacSha256Signer::class)]
interface WebhookSignerInterface
{
    /**
     * Compute the signature for a payload snapshot.
     *
     * @param  string  $payload    JSON-encoded payload body.
     * @param  string  $secret     Secret shared with the receiver.
     * @param  int     $timestamp  Unix timestamp when the payload is signed.
     * @param  string  $eventName  Event name (bound into the signature).
     * @return string  Hex-encoded signature string.
     */
    public function sign(
        string $payload,
        string $secret,
        int $timestamp,
        string $eventName,
    ): string;
}
