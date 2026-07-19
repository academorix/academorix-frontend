<?php

declare(strict_types=1);

namespace Academorix\Localization\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the decorated Translator resolved a key from the
 * DB cache. Sampled per `config('localization.translator.cache_hit_sample_ratio')`
 * so telemetry doesn't drown in per-request events.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.translation.cache_hit')]
final readonly class TranslationCacheHit
{
    use Dispatchable;

    /**
     * @param  string  $namespace    Namespace bucket.
     * @param  string  $group        Group name.
     * @param  string  $key          Translation key.
     * @param  string  $localeCode   BCP-47 tag.
     * @param  string  $source       'tenant_override' | 'platform_default' | 'redis_cache'.
     */
    public function __construct(
        public string $namespace,
        public string $group,
        public string $key,
        public string $localeCode,
        public string $source,
    ) {
    }
}
