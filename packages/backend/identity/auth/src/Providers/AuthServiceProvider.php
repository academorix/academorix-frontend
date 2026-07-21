<?php

/**
 * @file modules/identity/auth/src/Providers/AuthServiceProvider.php
 *
 * @description
 * Root service provider for the Auth domain module —
 * attribute-first end-to-end. Every contribution is attribute-
 * discovered by the shared framework loaders. The provider itself
 * declares the module identity, which conventional resources
 * auto-load, and a small boot-time hook that validates the HS256
 * shared secret before the module accepts a single request.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` on the concretes; `#[Bind]` on the interfaces (Laravel-canonical placement per ADR 0006).
 *   - Models: attribute-first — `#[Table]`, `#[Fillable]`, `#[UseFactory]`, `#[UsePolicy]`, `#[ObservedBy]`.
 *   - Actions: `#[AsAction]` + verb attribute (ADR 0016 actions-only).
 *   - Console commands: `#[AsCommand]` — auto-discovered by the base provider's `LoadsResources(commands: true)`.
 *   - Seeder: `#[AsSeeder]` on `AuthPermissionSeeder` — projects `AuthPermission` cases into spatie/laravel-permission.
 *   - Events: `#[AsEvent]` (discovered by `stackra/events`).
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Middleware: `#[AsMiddleware]` on each middleware class.
 */

declare(strict_types=1);

namespace Stackra\Auth\Providers;

use Stackra\Auth\Contracts\Services\JwtSignerInterface;
use Stackra\Auth\Services\JwtSigner;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Attributes\OnBoot;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Auth module service provider.
 *
 * Priority `8` places auth in the `identity` tier boot order.
 * Downstream modules load at a higher priority so their
 * attribute-driven wiring resolves after this module's
 * contributions land.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Auth', priority: 8)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class AuthServiceProvider extends ServiceProvider
{
    /**
     * Boot-time invariant — the HS256 shared secret is present +
     * strong enough. Fail-loud at boot beats silently signing weak
     * tokens at runtime.
     *
     * Skipped when the container hasn't yet bound the signer (e.g.
     * during a bootstrap-only artisan command that never actually
     * signs anything); the assertion only fires when a caller has
     * actually reached for the signer. This keeps `artisan migrate`
     * runnable on a fresh clone where SERVICE_JWT_SECRET is
     * documented but not yet set.
     */
    #[OnBoot(priority: 10)]
    protected function assertServiceJwtSecretValid(): void
    {
        // Skip in the local `testing` environment — the test suite
        // configures a fixture secret per Pest test case via
        // `config()->set(...)`, so an unset value at provider boot
        // is expected.
        if ($this->app->environment('testing')) {
            return;
        }

        // Only validate when the signer is bound. Skipping here keeps
        // a bare-bones `artisan config:cache` runnable even before the
        // downstream package is fully wired.
        if (! $this->app->bound(JwtSignerInterface::class) && ! $this->app->bound(JwtSigner::class)) {
            return;
        }

        /** @var JwtSigner $signer */
        $signer = $this->app->make(JwtSigner::class);
        $signer->assertBootSecretValid();
    }
}
