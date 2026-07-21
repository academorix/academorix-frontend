<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Console;

use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;

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
#[AsCommand(
    name: 'feature-flags:purge',
    description: 'Flush the platform-wide feature-flag cache.',
)]
final class PurgeFeatureFlags extends BaseCommand
{
    /**
     * Handle the command.
     *
     * @param  CacheRepository  $cache  Cache store used for resolution caching.
     */
    public function handle(CacheRepository $cache): int
    {
        $this->omni->titleBar('Purge Feature Flags Cache', 'sky');

        $store = $cache->getStore();
        if (\method_exists($store, 'tags')) {
            $cache->tags(['feature_flags'])->flush();
            $this->omni->statusSuccess('Cache tag flushed', 'the `feature_flags` cache tag was invalidated');
            $this->showDuration();

            return self::SUCCESS;
        }

        // Non-taggable stores (file, database, memcached without tags):
        // bump a version key that every cache read prefixes into its key.
        // Effectively invalidates every cached resolution by making the
        // old keys unreachable.
        $cache->forever('feature_flags:version:global', (int) (\microtime(true) * 1000));
        $this->omni->statusSuccess(
            'Cache version bumped',
            'store does not support tags — bumped `feature_flags:version:global`',
        );
        $this->showDuration();

        return self::SUCCESS;
    }
}
