<?php

declare(strict_types=1);

namespace Stackra\Localization\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Localization\Jobs\WarmTranslationCacheJob;

/**
 * `php artisan localization:warm-cache` — pre-populate the
 * translation cache for one tenant + locale.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'localization:warm-cache',
    description: 'Dispatch WarmTranslationCacheJob for a tenant + locale.',
)]
final class WarmCacheCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'localization:warm-cache
        {locale : BCP-47 locale}
        {--tenant= : Tenant id (default: platform-default rows)}
        {--namespace= : Optional namespace filter}
        {--limit=500 : Row cap}';

    public function handle(): int
    {
        $locale   = (string) $this->argument('locale');
        $tenantId = $this->option('tenant');
        $namespace = $this->option('namespace');
        $limitRaw = $this->option('limit');
        $limit    = \is_numeric($limitRaw) ? (int) $limitRaw : 500;

        WarmTranslationCacheJob::dispatch(
            tenantId: \is_string($tenantId) ? $tenantId : null,
            localeCode: $locale,
            namespace: \is_string($namespace) ? $namespace : null,
            limit: $limit,
        );

        $this->omni->titleBar('Localization Warm Cache', 'amber');
        $this->omni->success(\sprintf(
            'Dispatched WarmTranslationCacheJob (locale=%s, limit=%d).',
            $locale,
            $limit,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
