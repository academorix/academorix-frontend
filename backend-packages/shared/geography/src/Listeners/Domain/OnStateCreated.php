<?php

declare(strict_types=1);

namespace Academorix\Geography\Listeners\Domain;

use Academorix\Geography\Events\Domain\StateCreated;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `StateCreated` → invalidate states + parent country's
 * states index cache.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnStateCreated
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    public function handle(StateCreated $event): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.states'])->flush();
        }
    }
}
