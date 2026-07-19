<?php

declare(strict_types=1);

namespace Academorix\Geography\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Geography\Contracts\Repositories\CityRepositoryInterface;
use Academorix\Geography\Contracts\Repositories\CountryRepositoryInterface;
use Academorix\Geography\Contracts\Repositories\CurrencyRepositoryInterface;
use Academorix\Geography\Contracts\Repositories\LanguageRepositoryInterface;
use Academorix\Geography\Contracts\Repositories\StateRepositoryInterface;
use Academorix\Geography\Contracts\Repositories\TimezoneRepositoryInterface;

/**
 * `php artisan geography:describe` — print catalog stats.
 *
 * Row counts per entity + optional single-row lookup via
 * `--entity=Country --code=FR`. Useful for verifying that the vendor
 * seeder ran and platform-admin overrides are landing.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'geography:describe',
    description: 'Print catalog stats (row counts per entity + optional single-row lookup).',
)]
final class GeographyDescribeCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'geography:describe
        {--entity= : Restrict output to one entity (Country, State, City, Currency, Language, Timezone)}
        {--code= : Look up a single row by its natural code (iso2 / iso3 / iso-4217 / iso-639-1)}';

    public function handle(
        CountryRepositoryInterface $countries,
        StateRepositoryInterface $states,
        CityRepositoryInterface $cities,
        CurrencyRepositoryInterface $currencies,
        LanguageRepositoryInterface $languages,
        TimezoneRepositoryInterface $timezones,
    ): int {
        $this->omni->titleBar('Geography Catalog', 'sky');

        $entity = $this->option('entity');
        $code   = $this->option('code');

        // Single-row lookup mode when both --entity + --code are set.
        if (\is_string($entity) && $entity !== '' && \is_string($code) && $code !== '') {
            $this->describeOne($entity, $code, $countries, $currencies, $languages);
            $this->showDuration();

            return self::SUCCESS;
        }

        // Otherwise — count rows across the six catalogs.
        $this->omni->tableHeader('Entity', 'Row count');
        $this->omni->tableRow('Country', (string) $countries->all()->count());
        $this->omni->tableRow('State', (string) $states->all()->count());
        $this->omni->tableRow('City', (string) $cities->all()->count());
        $this->omni->tableRow('Currency', (string) $currencies->all()->count());
        $this->omni->tableRow('Language', (string) $languages->all()->count());
        $this->omni->tableRow('Timezone', (string) $timezones->all()->count());

        $this->omni->success('Catalog stats emitted.');
        $this->showDuration();

        return self::SUCCESS;
    }

    /**
     * Resolve one row by natural code and print its shape.
     */
    private function describeOne(
        string $entity,
        string $code,
        CountryRepositoryInterface $countries,
        CurrencyRepositoryInterface $currencies,
        LanguageRepositoryInterface $languages,
    ): void {
        $row = match (\strtolower($entity)) {
            'country'  => $countries->findByIso2($code),
            'currency' => $currencies->findByCode($code),
            'language' => $languages->findByCode($code),
            default    => null,
        };

        if ($row === null) {
            $this->omni->warning(\sprintf('No %s row matching code "%s".', $entity, $code));

            return;
        }

        $this->omni->success(\sprintf(
            'Resolved %s id=%d for code "%s".',
            $entity,
            (int) $row->getKey(),
            $code,
        ));
    }
}
