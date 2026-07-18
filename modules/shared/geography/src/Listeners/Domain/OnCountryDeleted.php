<?php

declare(strict_types=1);

namespace Academorix\Geography\Listeners\Domain;

use Academorix\Geography\Events\Domain\CountryDeleted;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `CountryDeleted` → invalidate country cache tags.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnCountryDeleted
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    public function handle(CountryDeleted $event): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.countries'])->flush();
        }
    }
}
