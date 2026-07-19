<?php

declare(strict_types=1);

namespace Academorix\Geography\Listeners\Domain;

use Academorix\Geography\Events\Domain\TimezoneDeleted;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `TimezoneDeleted` → invalidate timezone cache tags.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnTimezoneDeleted
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    public function handle(TimezoneDeleted $event): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.timezones'])->flush();
        }
    }
}
