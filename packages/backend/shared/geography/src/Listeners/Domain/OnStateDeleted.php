<?php

declare(strict_types=1);

namespace Stackra\Geography\Listeners\Domain;

use Stackra\Geography\Events\Domain\StateDeleted;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `StateDeleted` → invalidate state cache tags.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnStateDeleted
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    public function handle(StateDeleted $event): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.states'])->flush();
        }
    }
}
