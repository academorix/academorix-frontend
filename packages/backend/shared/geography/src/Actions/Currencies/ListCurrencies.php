<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Currencies;

use Stackra\Geography\Contracts\Repositories\CurrencyRepositoryInterface;
use Stackra\Geography\Data\Resources\CurrencyResourceData;
use Stackra\Geography\Models\Currency;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/geography/currencies` — public list of ISO-4217
 * currencies.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.currencies.list')]
#[Get('/api/v1/geography/currencies')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ListCurrencies
{
    use AsController;

    public function __construct(
        private readonly CurrencyRepositoryInterface $currencies,
    ) {
    }

    /**
     * @return DataCollection<int, CurrencyResourceData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->currencies->all()
            ->map(static fn (Currency $c): CurrencyResourceData => CurrencyResourceData::fromModel($c));

        return new DataCollection(CurrencyResourceData::class, $rows);
    }
}
