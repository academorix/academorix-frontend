<?php

declare(strict_types=1);

namespace Academorix\Geography\Listeners\Domain;

use Academorix\Geography\Events\Domain\CurrencyCreated;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `CurrencyCreated` → invalidate currency cache tags.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnCurrencyCreated
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    public function handle(CurrencyCreated $event): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.currencies'])->flush();
        }
    }
}
