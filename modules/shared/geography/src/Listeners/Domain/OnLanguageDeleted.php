<?php

declare(strict_types=1);

namespace Academorix\Geography\Listeners\Domain;

use Academorix\Geography\Events\Domain\LanguageDeleted;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Container\Attributes\Cache;

/**
 * Listener: `LanguageDeleted` → invalidate language cache tags.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class OnLanguageDeleted
{
    public function __construct(
        #[Cache] private readonly Repository $cache,
    ) {
    }

    public function handle(LanguageDeleted $event): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $store->tags(['geography.ref', 'geography.languages'])->flush();
        }
    }
}
