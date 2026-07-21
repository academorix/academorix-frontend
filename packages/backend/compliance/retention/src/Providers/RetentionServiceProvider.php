<?php

/**
 * @file packages/compliance/retention/src/Providers/RetentionServiceProvider.php
 *
 * @description
 * Root service provider for `stackra/retention`. Extends the
 * attribute-first
 * {@see \Stackra\ServiceProvider\Providers\ServiceProvider}
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
 *      {@see \Stackra\ServiceProvider\Support\BootstrapperRunner}
 *      iterates the registry at boot and populates the
 *      {@see \Stackra\Retention\Registry\RetentionPolicyRegistry}
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

namespace Stackra\Retention\Providers;

use Stackra\Retention\Bootstrappers\RetentionPolicyBootstrapper;
use Stackra\Retention\Console\RunRetentionCommand;
use Stackra\Retention\Registry\RetentionPolicyRegistry;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Attributes\OnBoot;
use Stackra\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Stackra\ServiceProvider\Providers\ServiceProvider;
use Stackra\ServiceProvider\Support\BootstrapperRunner;

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
     * attribute — our command carries the Stackra variant which
     * is a distinct class. Register the concrete class explicitly
     * so it survives the mismatch.
     *
     * TODO(console-package-discovery): drop this method once
     * `stackra/console` ships an `#[AsCommand]` discoverer
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
