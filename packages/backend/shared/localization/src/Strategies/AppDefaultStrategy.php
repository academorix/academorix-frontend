<?php

declare(strict_types=1);

namespace Stackra\Localization\Strategies;

use Stackra\Localization\Attributes\AsLocaleResolutionStrategy;
use Stackra\Localization\Contracts\Services\LocaleResolutionStrategyInterface;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Http\Request;

/**
 * Final fallback — return `config('localization.default_locale')`.
 *
 * Placed last in the default chain so every prior strategy has had
 * a chance to speak. Always returns a value (never null) — this is
 * the terminator.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsLocaleResolutionStrategy(name: 'app_default')]
#[Scoped]
final class AppDefaultStrategy implements LocaleResolutionStrategyInterface
{
    /**
     * @param  string  $defaultLocale  App-default BCP-47 tag.
     */
    public function __construct(
        #[Config('localization.default_locale', 'en')] private readonly string $defaultLocale,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(Request $request): ?string
    {
        return $this->defaultLocale;
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'app_default';
    }
}
