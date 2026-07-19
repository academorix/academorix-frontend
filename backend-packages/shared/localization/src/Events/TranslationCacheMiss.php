<?php

declare(strict_types=1);

namespace Academorix\Localization\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the decorated Translator missed every DB tier and
 * fell through to the filesystem lookup. Consumers can trigger
 * auto-translate on this signal.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.translation.cache_miss')]
final readonly class TranslationCacheMiss
{
    use Dispatchable;

    /**
     * @param  string|null  $tenantId    Tenant scope of the missed key.
     * @param  string       $namespace   Namespace bucket.
     * @param  string       $group       Group name.
     * @param  string       $key         Translation key.
     * @param  string       $localeCode  BCP-47 tag.
     */
    public function __construct(
        public ?string $tenantId,
        public string $namespace,
        public string $group,
        public string $key,
        public string $localeCode,
    ) {
    }
}
