<?php

declare(strict_types=1);

namespace Stackra\Geography\Listeners\Domain;

use Stackra\Geography\Events\Domain\CountryCreated;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `CountryCreated` → invalidate geography.cache tags for
 * countries + related indexes (region / subregion caches).
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnCountryCreated
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    /**
     * Flush the country-facing cache tags. The base Repository does
     * not always expose tag support; the tag-store check is defensive.
     */
    public function handle(CountryCreated $event): void
    {
        $store = $this->cache->getStore();

        // Tag-based invalidation is best-effort — only stores that
        // support tags (Redis, Memcached) implement flush-by-tag.
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.countries'])->flush();
        }
    }
}
