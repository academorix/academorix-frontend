<?php

/**
 * @file packages/authorization/src/Providers/AuthorizationServiceProvider.php
 *
 * @description
 * Root service provider for `stackra/authorization`. Auto-
 * discovered by Laravel via `composer.json`'s
 * `extra.laravel.providers`, so consumer apps get the wiring by
 * simply requiring the package — no manual `bootstrap/providers.php`
 * edit needed.
 *
 * ## What this provider does
 *
 * **Nothing at runtime.** Everything the package ships is
 * attribute-driven or standalone:
 *
 *   - The `authorize.action` middleware alias is registered by
 *     {@see \Stackra\Routing\Providers\RoutingServiceProvider}
 *     through the `#[AsMiddleware(alias: 'authorize.action')]`
 *     attribute on
 *     {@see \Stackra\Authorization\Middleware\AuthorizeControllerAction}.
 *     No imperative `Router::aliasMiddleware()` call is needed here.
 *   - The attributes are stateless value objects — no DI needed.
 *   - The middleware has a no-arg constructor — Laravel auto-DIs it.
 *   - The contracts are consumed by `packages/access`, which
 *     registers its own contributors against the container tags
 *     declared on those contracts.
 *
 * The provider is kept as the auto-discovery anchor referenced by
 * `composer.json`'s `extra.laravel.providers` — deleting it would
 * make Laravel skip package registration, and having a real class
 * here also gives us a stable extension point if the package later
 * grows runtime wiring.
 *
 * ## Attribute-first philosophy
 *
 * The old backend's `AccessServiceProvider` was ~200 lines of
 * imperative bindings, alias registrations, event listeners, and
 * registry hydration. This one is empty because:
 *
 *   - Attributes register themselves at composer-dump time (via
 *     `olvlvl/composer-attribute-collector`); no per-attribute
 *     boot code is needed here.
 *   - The middleware is discovered by the Routing package via
 *     `#[AsMiddleware]`; the container auto-resolves it.
 *   - Every domain package that ships permissions / roles
 *     registers its own contributor tag — this provider doesn't
 *     enumerate them.
 *
 * The heavier `packages/access` provider handles role / permission
 * registry hydration, spatie/laravel-permission wiring, super-admin
 * Gate::before, and admin controllers.
 *
 * @see \Stackra\Authorization\Middleware\AuthorizeControllerAction The middleware discovered via #[AsMiddleware].
 */

declare(strict_types=1);

namespace Stackra\Authorization\Providers;

use Illuminate\Support\ServiceProvider;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;

#[AsModule(name: 'Authorization', priority: 100)]
#[LoadsResources()]
final class AuthorizationServiceProvider extends ServiceProvider
{}
