<?php

declare(strict_types=1);

namespace Stackra\Geography\Listeners\Domain;

use Stackra\Geography\Events\Domain\CurrencyDeleted;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `CurrencyDeleted` → invalidate currency cache tags.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnCurrencyDeleted
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    public function handle(CurrencyDeleted $event): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.currencies'])->flush();
        }
    }
}
