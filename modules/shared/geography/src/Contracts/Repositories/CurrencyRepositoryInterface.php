<?php

declare(strict_types=1);

namespace Academorix\Geography\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Geography\Models\Currency;
use Academorix\Geography\Repositories\EloquentCurrencyRepository;
use Illuminate\Container\Attributes\Bind;

/**
 * Repository contract for {@see Currency}.
 *
 * @extends RepositoryInterface<Currency>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(EloquentCurrencyRepository::class)]
interface CurrencyRepositoryInterface extends RepositoryInterface
{
    /**
     * Find a currency by ISO-4217 code (case-insensitive).
     *
     * @param  string  $code  Three-letter ISO code (e.g. `EUR`).
     * @return Currency|null
     */
    public function findByCode(string $code): ?Currency;
}
