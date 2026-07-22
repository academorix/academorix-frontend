<?php

/**
 * @file modules/shared/localization/src/Providers/LocalizationServiceProvider.php
 *
 * @description
 * Root service provider for the Localization module — attribute-first.
 * Every contribution is attribute-discovered by the shared framework
 * loaders. The provider itself declares just the module identity,
 * which conventional resources auto-load, plus one one-off hook that
 * rebinds Laravel's `translator` container key to our decorator.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]`
 *     + `#[Filterable]` on each concrete; `#[Bind]` on each interface.
 *   - Actions: `#[AsAction]` + verb attribute + permission requirement.
 *   - Middleware: `#[AsMiddleware(alias: '...', priority: ...)]`.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeders: `#[AsSeeder(priority: 47/48)]`.
 *   - Events: `#[AsEvent]`.
 *   - Observers: `#[ObservedBy]` on each model.
 *   - Policies: `#[UsePolicy]` on each model.
 *   - Translator drivers: `#[AsTranslatorDriver('name')]` on each
 *     driver class → discovered via
 *     `#[HydratesFrom]` on
 *     {@see \Stackra\Localization\Contracts\Registry\TranslatorDriverRegistryInterface::register()}.
 *   - Locale-resolution strategies: `#[AsLocaleResolutionStrategy('name')]`
 *     on each strategy class → discovered via
 *     `#[HydratesFrom]` on
 *     {@see \Stackra\Localization\Contracts\Registry\LocaleResolutionStrategyRegistryInterface::register()}.
 */

declare(strict_types=1);

namespace Stackra\Localization\Providers;

use Stackra\Localization\Contracts\Repositories\PlatformLanguageRepositoryInterface;
use Stackra\Localization\Contracts\Repositories\TranslationRepositoryInterface;
use Stackra\Localization\Contracts\Services\TranslationCacheInterface;
use Stackra\Localization\Services\CachedTranslator;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Attributes\OnBoot;
use Stackra\ServiceProvider\Providers\ServiceProvider;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Contracts\Translation\Loader as TranslationLoader;

/**
 * Localization module service provider.
 *
 * Priority `66` — sits above geography (65) so the platform-language
 * seeder can resolve geography FKs at seed time. Depends on
 * `foundation`, `tenancy`, `activity`, `entitlements`, `geography`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Localization', priority: 66)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class LocalizationServiceProvider extends ServiceProvider
{
    /**
     * Rebind Laravel's `translator` container key to our
     * {@see CachedTranslator} decorator when
     * `config('localization.translator.decorate')` is enabled.
     *
     * Runs at boot so the parent Translator has already been bound
     * by Laravel's own TranslationServiceProvider. The rebind reuses
     * the parent's `translator.loader` binding + current locale so
     * every Laravel translation semantic (JSON files, dot notation,
     * pluralisation) works unchanged.
     */
    #[OnBoot(priority: 20)]
    protected function bindCachedTranslator(): void
    {
        if (! (bool) \config('localization.translator.decorate', true)) {
            return;
        }

        $this->app->extend('translator', function (mixed $translator, $app): mixed {
            // Guard — some deploy paths may resolve `translator`
            // before our container attributes are ready. Return the
            // parent verbatim in that case.
            if (! $app->bound(TranslationRepositoryInterface::class)) {
                return $translator;
            }

            /** @var TranslationLoader $loader */
            $loader = $app['translation.loader'];
            $locale = (string) $app->getLocale();

            return new CachedTranslator(
                translations: $app->make(TranslationRepositoryInterface::class),
                cache: $app->make(TranslationCacheInterface::class),
                languages: $app->make(PlatformLanguageRepositoryInterface::class),
                events: $app->make(Dispatcher::class),
                sampleRatio: (float) \config(
                    'localization.translator.cache_hit_sample_ratio',
                    0.01,
                ),
                loader: $loader,
                locale: $locale,
            );
        });
    }
}
