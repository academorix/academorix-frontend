<?php

declare(strict_types=1);

namespace Academorix\Geography\Listeners\Domain;

use Academorix\Geography\Events\Domain\CityCreated;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `CityCreated` → invalidate city cache tags. City-list
 * caches never do a full-table warm (150k rows) — cold miss is
 * accepted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnCityCreated
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    public function handle(CityCreated $event): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.cities'])->flush();
        }
    }
}
