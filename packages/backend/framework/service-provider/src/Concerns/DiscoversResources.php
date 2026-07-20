<?php

declare(strict_types=1);

/**
 * @file packages/service-provider/src/Concerns/DiscoversResources.php
 *
 * @description
 * Resource discovery for module service providers — the
 * "attribute-driven" side of the boot phase, complementing
 * {@see LoadsResources} which handles convention-based path
 * loading.
 *
 * ## Attribute-first — what discovery lives WHERE
 *
 * We deliberately do NOT scan for attributes that are already
 * owned by a domain package's own discovery. That would be two
 * ways to do the same thing. The concrete split:
 *
 *   - `#[AsController]` — routing package's `RouteRegistrar`.
 *   - `#[AsMiddleware]` — routing package's
 *     `RoutingServiceProvider` (`#[OnBoot]` scan).
 *   - `#[AsHealthCheck]` — health package's
 *     `HealthCheckDiscoverer`.
 *   - `#[Schedule]` / `#[Cron]` / `#[ScheduleWhen]` — scheduling
 *     package's `ScheduleDiscovery` + `ScheduleRegistrar`.
 *   - `#[OnEvent]` (class) / `#[ListensFor]` (method) — events
 *     package's `EventDiscovery`.
 *   - `#[ObservedBy]`, `#[UsePolicy]` — Laravel native, no
 *     scanner needed (Model reads them directly).
 *
 * This trait covers only the two remaining "cross-cutting"
 * discoveries that aren't owned by a domain package:
 *
 *   - Symfony's `#[AsCommand]` — third-party attribute, needs a
 *     Laravel-side bridge.
 *   - Convention seeder registration — pure filesystem check for
 *     `{ModuleNamespace}\Seeders\{ModuleName}DatabaseSeeder`.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */

namespace Academorix\ServiceProvider\Concerns;

use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\ModuleConstants;
use olvlvl\ComposerAttributeCollector\Attributes;
use Symfony\Component\Console\Attribute\AsCommand;

/**
 * Discovers cross-cutting resources (commands, seeders) at boot.
 *
 * Each discovery method targets a specific attribute or
 * convention. All attribute lookups use
 * `olvlvl/composer-attribute-collector`, which writes its findings
 * to `vendor/attributes.php` at `composer dump-autoload` time —
 * zero runtime filesystem scanning.
 */
trait DiscoversResources
{
    // -------------------------------------------------------------------------
    // Orchestration
    // -------------------------------------------------------------------------

    /**
     * Discover and register all enabled resources.
     *
     * Called during the boot phase by
     * {@see AsModuleProvider::bootModule()}. Each resource type
     * is discovered only if its flag is true in the
     * `#[LoadsResources]` attribute — omitting the attribute means
     * every flag defaults to false and nothing runs here.
     */
    protected function discoverResources(): void
    {
        if ($this->shouldLoad(LoadsResources::ATTR_COMMANDS)) {
            $this->discoverAndRegisterCommands();
        }

        if ($this->shouldLoad(LoadsResources::ATTR_SEEDERS)) {
            $this->registerSeeder();
        }
    }

    // -------------------------------------------------------------------------
    // Commands
    // -------------------------------------------------------------------------

    /**
     * Discover and register Artisan commands via Symfony's
     * `#[AsCommand]` attribute.
     *
     * Walks every class the composer attribute collector has
     * recorded as carrying `#[AsCommand]`. Abstract classes and
     * non-existent targets are filtered out.
     *
     * When the collector isn't primed (e.g. in a fresh clone
     * before `composer dump-autoload`), the discovery is skipped
     * silently — the next composer dump primes the file and the
     * commands appear on the subsequent boot.
     */
    protected function discoverAndRegisterCommands(): void
    {
        $commands = [];

        try {
            $targets = Attributes::findTargetClasses(AsCommand::class);
        } catch (\LogicException) {
            // Collector not primed — no commands to register on
            // this boot.
            return;
        }

        foreach ($targets as $target) {
            $className = $target->name;

            if (! class_exists($className)) {
                continue;
            }

            if ((new \ReflectionClass($className))->isAbstract()) {
                continue;
            }

            $commands[] = $className;
        }

        if ($commands === []) {
            return;
        }

        $this->commands($commands);
        $this->debugLog('Registered commands', ['count' => \count($commands)]);
    }

    // -------------------------------------------------------------------------
    // Seeders
    // -------------------------------------------------------------------------

    /**
     * Register the module's database seeder by convention.
     *
     * Looks for a class named
     * `{ModuleNamespace}\Seeders\{ModuleName}DatabaseSeeder` and
     * registers it in the `app.module_seeders` config array for
     * use with `php artisan db:seed`.
     *
     * Convention over reflection — no filesystem scan; if the
     * class doesn't exist under the expected name/namespace, the
     * method is a no-op.
     */
    protected function registerSeeder(): void
    {
        $seederClass = $this->getModuleNamespace()
            .'\\'.ModuleConstants::DIR_SEEDERS
            .'\\'.$this->getModuleName().'DatabaseSeeder';

        if (! class_exists($seederClass)) {
            return;
        }

        $this->app->booted(function () use ($seederClass): void {
            /** @var array<int, string> $seeders */
            $seeders = config('app.module_seeders', []);
            $seeders[] = $seederClass;
            config()->set('app.module_seeders', $seeders);
        });

        $this->debugLog('Registered seeder', ['class' => $seederClass]);
    }
}
