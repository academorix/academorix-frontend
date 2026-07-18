<?php

declare(strict_types=1);

namespace Academorix\Geography\Listeners\Domain;

use Academorix\Geography\Events\Domain\CityDeleted;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `CityDeleted` → invalidate city cache tags.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnCityDeleted
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    public function handle(CityDeleted $event): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.cities'])->flush();
        }
    }
}
