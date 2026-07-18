<?php

declare(strict_types=1);

/**
 * @file packages/events/src/Providers/EventsServiceProvider.php
 *
 * @description
 * Package entry point for `academorix/events`. Bridges the
 * attribute-based listener + broadcasting declarations to Laravel's
 * event dispatcher and broadcaster, so downstream packages never
 * touch a `EventServiceProvider::$listen` map or hand-roll
 * `broadcastOn()` / `broadcastAs()` methods.
 *
 * ## Zero-body bindings (ADR 0006)
 *
 * Every service in this package carries `#[Singleton]` +
 * `#[Config]` attributes directly on its class body:
 *
 *   - {@see \Academorix\Events\Support\EventDiscovery} —
 *     `#[Singleton]` + `#[Config('events.discovery.cache')]` +
 *     `#[Config('events.discovery.cache_path')]`.
 *   - {@see \Academorix\Events\Support\BroadcastConfigurator} —
 *     `#[Singleton]` + `#[Config('events.broadcast.default_channel_type')]`.
 *
 * No imperative binding closures live here.
 *
 * ## Responsibilities
 *
 *   1. Merge the shipped config under `events.*` at register time.
 *   2. Publish the config for env-specific overrides at boot time.
 *   3. Discover listeners + broadcast metadata at boot and wire
 *      them into the framework's dispatcher + broadcaster.
 *
 * ## Octane safety
 *
 *   - All bound services are `#[Singleton]` — their inputs
 *     (attribute-collector manifest, config values) are compile-
 *     time immutable.
 *   - No `env()` outside `config/events.php`.
 *   - No facade calls from inside the service methods — the
 *     dispatcher is injected into the boot hook via the container.
 *   - No static state accumulates: the discovery manifest is a
 *     read-only value materialised once per worker.
 */

namespace Academorix\Events\Providers;

use Academorix\Events\Support\BroadcastConfigurator;
use Academorix\Events\Support\EventDiscovery;
use Academorix\Events\Support\ListenerBinding;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\OnBoot;
use Academorix\ServiceProvider\Attributes\OnRegister;
use Academorix\ServiceProvider\Providers\ServiceProvider;
use Closure;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Wires attribute-based event discovery + broadcasting into the
 * host application.
 *
 * `#[LoadsResources]` is present with defaults — the events
 * package doesn't ship views / translations / migrations under
 * the conventional paths.
 */
#[AsModule(name: 'Events', priority: 25)]
#[LoadsResources()]
final class EventsServiceProvider extends ServiceProvider
{
    /**
     * Merge the shipped defaults under `events.*` — priority 10
     * so the values are populated before the `#[Config]` snapshots
     * on {@see EventDiscovery} / {@see BroadcastConfigurator}
     * resolve.
     */
    #[OnRegister(priority: 10)]
    protected function mergeConfig(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . '/../../config/events.php',
            'events',
        );
    }

    /**
     * Publish the config file so operators can override defaults.
     */
    #[OnBoot(priority: 10)]
    protected function publishConfig(): void
    {
        $this->publishes([
            __DIR__ . '/../../config/events.php' => $this->app->configPath('events.php'),
        ], 'events-config');
    }

    /**
     * Discover listeners + broadcasting metadata and wire them
     * into the framework's dispatcher and broadcasting
     * configurator.
     *
     * The shared {@see \Academorix\Foundation\Contracts\DiscoversAttributes}
     * binding gracefully returns empty iterables when the
     * attribute-collector manifest hasn't been generated yet — no
     * need to guard here.
     */
    #[OnBoot(priority: 50)]
    protected function bootDiscovery(): void
    {
        /** @var EventDiscovery $discovery */
        $discovery = $this->app->make(EventDiscovery::class);
        $manifest = $discovery->discover();

        /** @var EventDispatcher $dispatcher */
        $dispatcher = $this->app->make(EventDispatcher::class);

        foreach ($manifest->listeners as $binding) {
            $this->registerListener($dispatcher, $binding);
        }

        /** @var BroadcastConfigurator $configurator */
        $configurator = $this->app->make(BroadcastConfigurator::class);
        $configurator->registerAll($manifest->broadcastMetadata);
    }

    /**
     * Translate a single {@see ListenerBinding} into a call to the
     * framework's dispatcher. Wraps the callback in after-commit /
     * queued closures as needed.
     */
    private function registerListener(EventDispatcher $dispatcher, ListenerBinding $binding): void
    {
        $listener = $this->buildListenerCallable($binding);

        $dispatcher->listen($binding->eventClass, $listener);
    }

    /**
     * Build the actual callable the dispatcher invokes for a
     * binding. When neither `queued` nor `afterCommit` is set, we
     * use the plain `[Class::class, 'method']` shape — the
     * dispatcher itself honours `ShouldQueue` for classes that
     * implement it.
     *
     * When `afterCommit` is set, the callable defers execution via
     * `DB::afterCommit(...)`. When there is no active transaction,
     * the framework runs the closure immediately.
     *
     * When `queued` is set on a listener that does not implement
     * {@see ShouldQueue}, the callable wraps `dispatch()` of a
     * queued closure so it still lands on the queue.
     *
     * Laravel's modern `Dispatcher::listen()` contract does not
     * accept a per-registration priority; higher priority is
     * approximated by earlier registration order — packages are
     * booted in composer discovery order and per-package listeners
     * are registered in the order the attribute scanner yields
     * them. `ListenerBinding::$priority` is preserved on the DTO
     * so future dispatchers that do honour priority can consume
     * it without a manifest migration.
     *
     * @return array{0: class-string, 1: string}|Closure
     */
    private function buildListenerCallable(ListenerBinding $binding): array|Closure
    {
        $method = $binding->method;
        $class = $binding->listenerClass;
        $afterCommit = $binding->afterCommit;
        $forceQueued = $binding->queued && ! is_subclass_of($class, ShouldQueue::class);
        $container = $this->app;

        if (! $afterCommit && ! $forceQueued) {
            return [$class, $method];
        }

        return static function (mixed ...$payload) use ($container, $class, $method, $afterCommit, $forceQueued): void {
            $invoke = static function () use ($container, $class, $method, $payload, $forceQueued): void {
                if ($forceQueued && function_exists('dispatch')) {
                    // Wrap the call in a queued closure — matches
                    // the framework's own behaviour when a listener
                    // implements ShouldQueue without any interface
                    // marker.
                    dispatch(static function () use ($container, $class, $method, $payload): void {
                        /** @var object $listener */
                        $listener = $container->make($class);
                        $listener->{$method}(...$payload);
                    });

                    return;
                }

                /** @var object $listener */
                $listener = $container->make($class);
                $listener->{$method}(...$payload);
            };

            if ($afterCommit && class_exists(DB::class)) {
                try {
                    DB::afterCommit($invoke);

                    return;
                } catch (Throwable) {
                    // No active connection / transaction manager —
                    // fall through and invoke immediately.
                }
            }

            $invoke();
        };
    }
}
