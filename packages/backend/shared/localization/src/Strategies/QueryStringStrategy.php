<?php

declare(strict_types=1);

namespace Stackra\Localization\Strategies;

use Stackra\Localization\Attributes\AsLocaleResolutionStrategy;
use Stackra\Localization\Contracts\Services\LocaleResolutionStrategyInterface;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Http\Request;

/**
 * Resolve the active locale from a `?locale=` query parameter.
 *
 * The parameter name is configurable — `config('localization.resolve.query_key')`.
 * Highest priority in the default chain because it's the explicit
 * developer / QA override.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsLocaleResolutionStrategy(name: 'query')]
#[Scoped]
final class QueryStringStrategy implements LocaleResolutionStrategyInterface
{
    /**
     * @param  string  $queryKey  Query parameter name.
     */
    public function __construct(
        #[Config('localization.resolve.query_key', 'locale')] private readonly string $queryKey,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(Request $request): ?string
    {
        $value = $request->query($this->queryKey);
        if (! \is_string($value) || $value === '') {
            return null;
        }

        return $value;
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'query';
    }
}
