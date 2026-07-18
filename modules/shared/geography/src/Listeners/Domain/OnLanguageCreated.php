<?php

declare(strict_types=1);

namespace Academorix\Geography\Listeners\Domain;

use Academorix\Geography\Events\Domain\LanguageCreated;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `LanguageCreated` → invalidate language cache tags.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnLanguageCreated
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    public function handle(LanguageCreated $event): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.languages'])->flush();
        }
    }
}
