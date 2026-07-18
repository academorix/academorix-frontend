<?php

/**
 * @file packages/compliance/retention/src/Providers/RetentionServiceProvider.php
 *
 * @description
 * Root service provider for `academorix/retention`. Extends the
 * attribute-first
 * {@see \Academorix\ServiceProvider\Providers\ServiceProvider}
 * base — every boot-phase concern is an `#[OnBoot]` method the
 * base's `bootModule()` dispatches in priority order.
 *
 * ## What this provider does
 *
 *   1. Declares module identity + resource loading via
 *      `#[AsModule]` + `#[LoadsResources(config: true, commands: true, publishables: true)]`
 *      so the base auto-wires the shipped `config/retention.php`,
 *      auto-discovers the `#[AsCommand]` command, and publishes
 *      the config file under the `retention-config` tag.
 *
 *   2. Ships the {@see RetentionPolicyBootstrapper} — registered
 *      via the `$bootstrappers` array. The framework's shared
 *      {@see \Academorix\ServiceProvider\Support\BootstrapperRunner}
 *      iterates the registry at boot and populates the
 *      {@see \Academorix\Retention\Registry\RetentionPolicyRegistry}
 *      through the bootstrapper's cache-aware lifecycle. The
 *      previous `afterResolving(RetentionPolicyRegistry::class, …)`
 *      hook was removed in Phase 2.C — the framework runner
 *      supersedes it.
 *
 * ## Module priority
 *
 * Priority 200 — runs AFTER every core framework package.
 */

declare(strict_types=1);

namespace Academorix\Retention\Providers;

use Academorix\Retention\Bootstrappers\RetentionPolicyBootstrapper;
use Academorix\Retention\Console\RunRetentionCommand;
use Academorix\Retention\Registry\RetentionPolicyRegistry;
use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Attributes\OnBoot;
use Academorix\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Academorix\ServiceProvider\Providers\ServiceProvider;
use Academorix\ServiceProvider\Support\BootstrapperRunner;

/**
 * Root provider for the retention package.
 *
 * @category Retention
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Retention', priority: 200)]
#[LoadsResources(config: true, commands: true, publishables: true)]
final class RetentionServiceProvider extends ServiceProvider
{
    /**
     * Bootstrappers this module ships.
     *
     * The framework's
     * {@see BootstrapperRunner}
     * iterates the shared registry at boot and populates the
     * {@see RetentionPolicyRegistry}
     * through the cache-aware lifecycle. No `afterResolving()`
     * hook required — see Phase 2.C notes on ADR 0020.
     *
     * @var list<class-string<AbstractBootstrapper>>
     */
    protected array $bootstrappers = [
        RetentionPolicyBootstrapper::class,
    ];

    /**
     * Register the {@see RunRetentionCommand} with Laravel's
     * console kernel.
     *
     * The base's `#[LoadsResources(commands: true)]` scan targets
     * Symfony's `\Symfony\Component\Console\Attribute\AsCommand`
     * attribute — our command carries the Academorix variant which
     * is a distinct class. Register the concrete class explicitly
     * so it survives the mismatch.
     *
     * TODO(console-package-discovery): drop this method once
     * `academorix/console` ships an `#[AsCommand]` discoverer
     * bridged into the service-provider base.
     */
    #[OnBoot(priority: 20)]
    protected function bootRetentionCommand(): void
    {
        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->commands([RunRetentionCommand::class]);
    }
}
