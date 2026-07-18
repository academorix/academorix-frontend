<?php

declare(strict_types=1);

namespace Academorix\Geography\Listeners\Domain;

use Academorix\Geography\Events\Domain\CurrencyUpdated;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `CurrencyUpdated` → invalidate currency cache tags.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnCurrencyUpdated
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    public function handle(CurrencyUpdated $event): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.currencies'])->flush();
        }
    }
}
