<?php

declare(strict_types=1);

/**
 * Example 1: Minimal Service Provider.
 *
 * The simplest possible module service provider. Just add the #[AsModule]
 * attribute and extend the base ServiceProvider — everything else is
 * automatic.
 *
 * What happens automatically:
 *   - Migrations loaded from src/Migrations/
 *   - Config merged from config/config.php
 *   - Views loaded from src/views/ (namespaced as 'blog::')
 *   - Translations loaded from src/i18n/ (namespaced as 'blog::')
 *   - Routes loaded from src/routes/api.php, web.php, channels.php
 *   - Commands discovered from src/Console/Commands/ via #[AsCommand]
 *   - Controllers discovered via #[AsController]
 *     (pending — see stackra/routing TODO in DiscoversResources)
 *   - Middleware discovered via `#[AsMiddleware]` (routing package)
 *   - Listeners discovered via `#[OnEvent]` + `#[ListensFor]`
 *     (events package)
 *   - Seeders registered by convention (BlogDatabaseSeeder)
 *   - Assets, config, views, translations registered as publishable
 *   - Lifecycle events fired (module.registering, module.registered,
 *     module.booting, module.booted)
 *
 * Expected module directory structure:
 *   packages/blog/
 *   ├── config/
 *   │   └── config.php
 *   ├── src/
 *   │   ├── Console/
 *   │   │   └── Commands/
 *   │   │       └── PublishPostCommand.php    (#[AsCommand])
 *   │   ├── Controllers/
 *   │   ├── Controllers/
 *   │   │   └── PostController.php            (#[AsController])
 *   │   ├── Listeners/
 *   │   │   └── SendPostNotification.php      (#[OnEvent])
 *   │   ├── Migrations/
 *   │   │   └── 2025_01_01_000000_create_posts_table.php
 *   │   ├── Models/
 *   │   │   └── Post.php
 *   │   ├── Providers/
 *   │   │   └── BlogServiceProvider.php       (this file)
 *   │   ├── Seeders/
 *   │   │   └── BlogDatabaseSeeder.php
 *   │   ├── i18n/
 *   │   │   ├── en/
 *   │   │   │   └── messages.php
 *   │   │   └── ar/
 *   │   │       └── messages.php
 *   │   ├── routes/
 *   │   │   ├── api.php
 *   │   │   └── web.php
 *   │   └── views/
 *   │       └── posts/
 *   │           └── index.blade.php
 *   └── resources/
 *       ├── css/
 *       └── js/
 *
 * @category Examples
 *
 * @since    1.0.0
 */

namespace Stackra\Blog\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Blog module service provider.
 *
 * Zero boilerplate — the #[AsModule] attribute declares identity,
 * and the base class handles everything else.
 */
#[AsModule(
    name: 'Blog',
    namespace: 'Stackra\\Blog',
)]
class BlogServiceProvider extends ServiceProvider
{
    // That's it. No properties, no flags, no should*() methods.
    // All resources are auto-loaded from conventional paths.
    // All discovery is cached via olvlvl/composer-attribute-collector.
    // All attribute reading is cached via composer-attribute-collector.
}
