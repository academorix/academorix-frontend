<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Console;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

/**
 * `feature-flags:purge` — flush the platform-wide feature-flag cache.
 *
 * Flushes the `feature_flags` cache tag when the store supports
 * tags, or bumps the `feature_flags:version:global` key otherwise.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Signature('feature-flags:purge')]
#[Description('Flush the platform-wide feature-flag cache.')]
final class PurgeFeatureFlags extends Command
{
    /**
     * @param  CacheRepository  $cache  Cache store used for resolution caching.
     */
    public function __construct(
        private readonly CacheRepository $cache,
    ) {
        parent::__construct();
    }

    /**
     * Handle the command.
     *
     * @return int
     */
    public function handle(): int
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $this->cache->tags(['feature_flags'])->flush();
            $this->info('Flushed the feature_flags cache tag.');

            return self::SUCCESS;
        }

        $this->cache->forever('feature_flags:version:global', (int) (microtime(true) * 1000));
        $this->info('Bumped the platform-wide feature-flag cache version.');

        return self::SUCCESS;
    }
}
