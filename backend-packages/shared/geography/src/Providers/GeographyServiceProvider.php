<?php

/**
 * @file modules/shared/geography/src/Providers/GeographyServiceProvider.php
 *
 * @description
 * Root service provider for the Geography module — attribute-first.
 * Every contribution is attribute-discovered by the shared framework
 * loaders. The provider itself declares just the module identity,
 * which conventional resources auto-load, plus two one-off hooks:
 *
 *   - `#[OnRegister]` rebinds vendor `world.models.*` config keys to
 *     our subclass models so vendor relations return our subclasses.
 *   - `#[OnBoot]` registers the `throttle:geolocate` rate-limiter
 *     used by the `/geolocate` route.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]`
 *     + `#[Filterable]` on each concrete; `#[Bind]` on each interface.
 *   - Actions: `#[AsAction]` + verb attribute + permission requirement.
 *   - Middleware: `#[AsMiddleware(alias: '...', priority: ...)]`.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 46)]` — composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `implements ShouldDispatchAfterCommit` for domain events.
 *   - Observers: `#[ObservedBy]` on each subclass model.
 *   - Policies: `#[UsePolicy]` on each subclass model.
 *   - Service impl: interface carries `#[Bind]` pointing at
 *     `MaxMindGeolocateService` (default); consumer apps override the
 *     binding to a stub or an alternative implementation.
 */

declare(strict_types=1);

namespace Academorix\Geography\Providers;

use Academorix\Geography\Models\City;
use Academorix\Geography\Models\Country;
use Academorix\Geography\Models\Currency;
use Academorix\Geography\Models\Language;
use Academorix\Geography\Models\State;
use Academorix\Geography\Models\Timezone;
use Academorix\Geography\RateLimiters\GeolocateRateLimiter;
use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Attributes\OnBoot;
use Academorix\ServiceProvider\Attributes\OnRegister;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Geography module service provider.
 *
 * Priority `65` — sits above the identity/tenancy tier (10–29) and
 * above the observability tier (20–45), matching the "reference
 * infrastructure" placement: every feature module can safely depend
 * on Geography, but Geography depends only on Foundation.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Geography', priority: 65)]
#[LoadsResources(
    config: true,
    migrations: false,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class GeographyServiceProvider extends ServiceProvider
{
    /**
     * Rebind vendor `world.models.*` config keys to our subclass
     * models so vendor relations (`Country::states`, `State::cities`,
     * ...) return our types instead of vendor types.
     *
     * Runs during `register()` — before any Eloquent model resolves
     * its relations at boot.
     */
    #[OnRegister(priority: 10)]
    protected function rebindVendorModels(): void
    {
        // Priority 10 — must run before any downstream module resolves
        // a vendor relation to a `Country` / `State` / `City` / ...
        \config([
            'world.models.country'  => Country::class,
            'world.models.state'    => State::class,
            'world.models.city'     => City::class,
            'world.models.currency' => Currency::class,
            'world.models.language' => Language::class,
            'world.models.timezone' => Timezone::class,
        ]);
    }

    /**
     * Register the `throttle:geolocate` rate-limiter definition used
     * by the `/api/v1/geography/geolocate` route. Delegates to
     * {@see GeolocateRateLimiter::register()} so the definition
     * itself is testable in isolation.
     */
    #[OnBoot(priority: 20)]
    protected function registerRateLimiters(): void
    {
        GeolocateRateLimiter::register();
    }
}
