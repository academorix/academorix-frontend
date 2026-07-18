<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Countries;

use Academorix\Geography\Contracts\Repositories\CountryRepositoryInterface;
use Academorix\Geography\Data\Resources\CountryResourceData;
use Academorix\Geography\Models\Country;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/geography/countries` — public list of countries.
 *
 * Anonymous burst-safe via the `geography.cache` middleware (1h TTL
 * keyed by `path + query + locale`). No auth gate — policies accept
 * a nullable Authenticatable.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.countries.list')]
#[Get('/api/v1/geography/countries')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ListCountries
{
    use AsController;

    public function __construct(
        private readonly CountryRepositoryInterface $countries,
    ) {
    }

    /**
     * @return DataCollection<int, CountryResourceData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->countries->all()
            ->map(static fn (Country $c): CountryResourceData => CountryResourceData::fromModel($c));

        return new DataCollection(CountryResourceData::class, $rows);
    }
}
