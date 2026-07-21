<?php

declare(strict_types=1);

namespace Stackra\Webhook\Services;

use Stackra\Webhook\Contracts\Services\WebhookSignerInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default HMAC-SHA256 signer.
 *
 * Signature format: `hex(hmac_sha256(timestamp + '.' + event +
 * '.' + payload, secret))`. Matches the blueprint's `X-Webhook-Signature`
 * header contract.
 *
 * `#[Singleton]` — stateless, safe to reuse across every request.
 * The interface declares the container binding via
 * `#[Bind(HmacSha256Signer::class)]` (Pattern A per
 * `.kiro/steering/php-attributes.md`), so this concrete carries only
 * its lifetime attribute.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Singleton]
final class HmacSha256Signer implements WebhookSignerInterface
{
    /**
     * {@inheritDoc}
     */
    public function sign(
        string $payload,
        string $secret,
        int $timestamp,
        string $eventName,
    ): string {
        $material = $timestamp . '.' . $eventName . '.' . $payload;

        return \hash_hmac('sha256', $material, $secret);
    }
}
