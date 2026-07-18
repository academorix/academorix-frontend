<?php

declare(strict_types=1);

namespace Academorix\Localization\Services;

use Academorix\Localization\Contracts\Services\LocaleResolutionStrategyRegistryInterface;
use Academorix\Localization\Contracts\Services\LocaleResolverInterface;
use Academorix\Localization\Data\LocaleResolutionResultData;
use Academorix\Localization\Enums\LocaleResolutionSource;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Http\Request;

/**
 * Default implementation of {@see LocaleResolverInterface}.
 *
 * Iterates the config-declared chain — first strategy that returns
 * a non-null BCP-47 tag wins. Falls through to
 * `config('localization.default_locale')` when every strategy
 * misses.
 *
 * `#[Scoped]` because the resolution is per-request state.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Scoped]
final class LocaleResolver implements LocaleResolverInterface
{
    /**
     * @param  LocaleResolutionStrategyRegistryInterface  $strategies    Strategy catalogue.
     * @param  list<string>                               $chain         Ordered list of strategy names.
     * @param  string                                     $defaultLocale App-default BCP-47 tag.
     * @param  string                                     $fallbackLocale Fallback BCP-47 tag.
     */
    public function __construct(
        private readonly LocaleResolutionStrategyRegistryInterface $strategies,
        #[Config('localization.resolve.chain')] private readonly array $chain,
        #[Config('localization.default_locale', 'en')] private readonly string $defaultLocale,
        #[Config('localization.fallback_locale', 'en')] private readonly string $fallbackLocale,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(Request $request): LocaleResolutionResultData
    {
        foreach ($this->chain as $strategyName) {
            $strategyName = (string) $strategyName;

            // Guard against a mis-configured chain — an unknown
            // strategy name is a config bug, not a resolution
            // failure. Skip and continue rather than raising.
            if (! $this->strategies->has($strategyName)) {
                continue;
            }

            $locale = $this->strategies->resolve($strategyName)->resolve($request);
            if ($locale === null || $locale === '') {
                continue;
            }

            $source = LocaleResolutionSource::tryFrom($strategyName) ?? LocaleResolutionSource::AppDefault;

            return new LocaleResolutionResultData(
                localeCode: $locale,
                source: $source,
                fallbackCode: $this->fallbackLocale,
            );
        }

        // Every strategy missed — surface the app-default result.
        return new LocaleResolutionResultData(
            localeCode: $this->defaultLocale,
            source: LocaleResolutionSource::AppDefault,
            fallbackCode: $this->fallbackLocale,
        );
    }
}
