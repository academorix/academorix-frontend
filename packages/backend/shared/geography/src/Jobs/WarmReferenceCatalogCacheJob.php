<?php

declare(strict_types=1);

namespace Academorix\Geography\Jobs;

use Academorix\Geography\Contracts\Repositories\CountryRepositoryInterface;
use Academorix\Geography\Contracts\Repositories\CurrencyRepositoryInterface;
use Academorix\Geography\Contracts\Repositories\LanguageRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Pre-populate the geography.cache Redis entries for the top-N
 * most-hit list queries per locale.
 *
 * Runs hourly at :20 via schedule.json. Skips the cities table
 * intentionally — a 150k-row warm is more expensive than the cold
 * miss it would prevent.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(2)]
#[UniqueFor(3600)]
final class WarmReferenceCatalogCacheJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Unique id — the job is a singleton.
     */
    public function uniqueId(): string
    {
        return 'geography.warm_cache';
    }

    /**
     * Handle the warm — iterate the small, high-hit catalogs
     * (countries, currencies, languages) and force cache-population
     * by calling `->all()` on each repository.
     */
    public function handle(
        CountryRepositoryInterface $countries,
        CurrencyRepositoryInterface $currencies,
        LanguageRepositoryInterface $languages,
        LoggerInterface $log,
    ): void {
        // Iterate the low-cardinality catalogs — the `#[Cacheable]`
        // attribute on each repository handles the actual key writes.
        $countries->all();
        $currencies->all();
        $languages->all();

        $log->info('geography.warm_cache.complete', [
            'countries_warmed'  => true,
            'currencies_warmed' => true,
            'languages_warmed'  => true,
        ]);
    }
}
