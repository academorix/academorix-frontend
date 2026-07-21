<?php

declare(strict_types=1);

/**
 * Example 2: API-Only Service Provider.
 *
 * A module that serves only API endpoints — no views, no translations,
 * no publishable assets. Uses #[LoadsResources] to disable unnecessary
 * resource types.
 *
 * What is loaded:
 *   ✅ Migrations, Config, Routes, Commands, Seeders, Middleware, Listeners
 *
 * What is skipped:
 *   ❌ Views, Translations, Publishable assets
 *
 * @category Examples
 *
 * @since    1.0.0
 */

namespace Stackra\Api\Providers;

use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * API module service provider.
 *
 * Disables views, translations, and publishables since this module
 * only serves JSON API responses.
 */
#[AsModule(
    name: 'Api',
    namespace: 'Stackra\\Api',
)]
#[LoadsResources(
    views: false,
    translations: false,
    publishables: false,
)]
class ApiServiceProvider extends ServiceProvider
{
    // Only API-relevant resources are loaded.
    // Views, translations, and publishable assets are skipped entirely.
}
