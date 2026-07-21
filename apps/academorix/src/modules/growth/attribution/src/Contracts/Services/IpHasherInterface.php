<?php

declare(strict_types=1);

namespace Stackra\Attribution\Contracts\Services;

use Stackra\Attribution\Services\IpHasher;
use Illuminate\Container\Attributes\Bind;

/**
 * GDPR/CCPA-safe IP hasher.
 *
 * Concrete: {@see IpHasher}.
 *
 * @category Attribution
 *
 * @since    0.1.0
 */
#[Bind(IpHasher::class)]
interface IpHasherInterface
{
    /**
     * Return a stable, non-reversible identifier for an IP address.
     */
    public function hash(string $ip): string;

    /**
     * Return a partially-anonymised form of the IP address (zeroed
     * last octet on IPv4 / last 80 bits on IPv6). Useful for
     * geolocation without storing full addresses.
     */
    public function anonymise(string $ip): string;
}
