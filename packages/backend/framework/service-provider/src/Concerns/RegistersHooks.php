<?php

declare(strict_types=1);

/**
 * @file packages/service-provider/src/Concerns/RegistersHooks.php
 *
 * @description
 * Consolidates the hook-interface + method-attribute dispatch
 * logic for module service providers. This trait is the only
 * place the lifecycle traverses hook interfaces and method
 * attributes — all `instanceof` checks are done here, all
 * `#[OnRegister]` / `#[OnBoot]` / `#[OnTerminate]` methods are
 * discovered and invoked here.
 *
 * ## Attribute-first — what this trait does NOT dispatch
 *
 * Every "hook" already served by a dedicated attribute + discovery
 * elsewhere in the monorepo is deliberately absent from the
 * dispatch here. Specifically:
 *
 *   - Middleware aliases → `#[AsMiddleware]` on the middleware
 *     class, discovered by `RoutingServiceProvider`.
 *   - Routes → `#[AsController]` on the controller class,
 *     discovered by `RouteRegistrar` (we forbid `routes/*.php`).
 *   - Model observers → `#[ObservedBy]` on the model (Laravel
 *     native).
 *   - Authorization policies → `#[UsePolicy]` on the model
 *     (Laravel native).
 *   - Health checks → `#[AsHealthCheck]` on the check class,
 *     discovered by the health package.
 *   - Scheduled tasks → `#[Schedule]` / `#[Cron]` /
 *     `#[ScheduleWhen]` on the job/command, discovered by the
 *     scheduling package.
 *   - Event listeners → `#[OnEvent]` (class) / `#[ListensFor]`
 *     (method), discovered by the events package.
 *   - Post-response cleanup → `#[OnTerminate]` method attribute
 *     (below).
 *
 * The remaining hook interfaces this trait dispatches are
 * {@see HasBindings} and {@see HasMacros} — cases where imperative
 * code is genuinely necessary (closures / config-driven bindings
 * / tag-based bindings / macro definitions on macroable classes).
 *
 * @category Concerns
 *
 * @since    1.0.0
 */

namespace Stackra\ServiceProvider\Concerns;

use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Attributes\OnBoot;
use Stackra\ServiceProvider\Attributes\OnRegister;
use Stackra\ServiceProvider\Attributes\OnTerminate;
use Stackra\ServiceProvider\Contracts\HasBindings;
use Stackra\ServiceProvider\Contracts\HasMacros;
use olvlvl\ComposerAttributeCollector\Attributes;

/**
 * Dispatches the two remaining hook interfaces ({@see HasBindings},
 * {@see HasMacros}) plus every method annotated with
 * `#[OnRegister]` / `#[OnBoot]` / `#[OnTerminate]`.
 *
 * All interface checks use `instanceof` — zero runtime reflection
 * for that path. Method-attribute discovery uses
 * `olvlvl/composer-attribute-collector`'s cached manifest, so each
 * lookup is an O(1) static-array read.
 */
trait RegistersHooks
{
    /**
     * Determine whether a given resource type should be loaded.
     *
     * Present on the composing class through the
     * {@see ReadsAttributes} trait — this abstract declaration
     * lets the trait use `shouldLoad()` without a hard dependency.
     *
     * @param  string  $attribute  The LoadsResources attribute flag.
     */
    abstract protected function shouldLoad(string $attribute): bool;

    // -------------------------------------------------------------------------
    // Register-phase dispatch
    // -------------------------------------------------------------------------

    /**
     * Dispatch all register-phase hooks based on implemented
     * interfaces + method attributes.
     *
     * Called during the register phase by
     * {@see AsModuleProvider::registerModule()}. Execution order:
     *
     *   1. `HasBindings::bindings()` — imperative container wiring
     *      (closures, config-driven bindings, tag-based bindings,
     *      contract rebinds).
     *   2. Every `#[OnRegister]` method — sorted by priority
     *      ascending (lower first).
     */
    protected function dispatchRegisterHooks(): void
    {
        // HasBindings — the one hook interface that hasn't been
        // superseded by an attribute. Imperative wiring for
        // closures / tags / config-driven binds / contract rebinds
        // still needs code, not attributes.
        if ($this instanceof HasBindings) {
            $this->bindings();
            $this->debugLog('Dispatched HasBindings hook');
        }

        // #[OnRegister] method attributes — auto-discovered
        // lifecycle hooks. Priority-sorted (lower first) so
        // provider authors can force ordering when needed.
        $this->dispatchLifecycleAttributes(OnRegister::class);
    }

    // -------------------------------------------------------------------------
    // Boot-phase dispatch
    // -------------------------------------------------------------------------

    /**
     * Dispatch all boot-phase hooks based on implemented
     * interfaces + method attributes.
     *
     * Called during the boot phase by
     * {@see AsModuleProvider::bootModule()}. Execution order:
     *
     *   1. `HasMacros::macros()` — imperative macro definitions
     *      on macroable classes (`Str::macro(...)`,
     *      `Str::macro(...)`, `Builder::macro(...)`). Gated by
     *      `#[LoadsResources(macros: true)]`.
     *   2. Every `#[OnBoot]` method — sorted by priority
     *      ascending.
     *   3. Every `#[OnTerminate]` method — each registered as a
     *      `$this->app->terminating(...)` callback so it runs
     *      AFTER the response is sent.
     */
    protected function dispatchBootHooks(): void
    {
        // HasMacros — no macro attribute exists in the monorepo
        // yet; imperative registration is the right shape. Gated
        // by the `macros` flag so a provider can ship macros
        // methods that only fire when the operator opts in.
        if ($this instanceof HasMacros && $this->shouldLoad(LoadsResources::ATTR_MACROS)) {
            $this->macros();
            $this->debugLog('Dispatched HasMacros hook');
        }

        // #[OnBoot] method attributes — the primary escape hatch
        // for boot-time work.
        $this->dispatchLifecycleAttributes(OnBoot::class);

        // #[OnTerminate] method attributes — register as
        // terminating callbacks so they fire post-response.
        $this->registerTerminateAttributes();
    }

    // -------------------------------------------------------------------------
    // Lifecycle attribute dispatch — the workhorse
    // -------------------------------------------------------------------------

    /**
     * Discover and dispatch methods annotated with a lifecycle
     * attribute (`#[OnRegister]` or `#[OnBoot]`).
     *
     * Reads method-level attributes from the service provider
     * class via olvlvl's `Attributes::forClass()`. Methods are
     * sorted by priority ascending (lower first) and called in
     * order. When the collector isn't primed (fresh clone before
     * `composer dump-autoload`), the dispatch is skipped rather
     * than failing.
     *
     * @param  class-string  $attributeClass  The lifecycle attribute class.
     */
    private function dispatchLifecycleAttributes(string $attributeClass): void
    {
        try {
            $forClass = Attributes::forClass(static::class);
        } catch (\LogicException) {
            // Collector not primed — no methods to dispatch on
            // this boot. Downstream `composer dump-autoload` will
            // populate the manifest and subsequent boots pick it
            // up automatically.
            return;
        }

        $methods = [];

        foreach ($forClass->methodsAttributes as $methodName => $attrs) {
            foreach ($attrs as $attr) {
                if ($attr::class === $attributeClass) {
                    $methods[] = ['method' => $methodName, 'priority' => $attr->priority];
                }
            }
        }

        if ($methods === []) {
            return;
        }

        // Sort ascending by priority — lower runs first so
        // provider authors can put config merges (priority 10)
        // ahead of container bindings (priority 100).
        usort($methods, static fn (array $a, array $b): int => $a['priority'] <=> $b['priority']);

        foreach ($methods as $entry) {
            $this->{$entry['method']}();
            $this->debugLog("Dispatched #{$attributeClass} on {$entry['method']}()");
        }
    }

    /**
     * Discover and register methods annotated with `#[OnTerminate]`.
     *
     * Each annotated method is registered as a terminating
     * callback via `$this->app->terminating()`. Methods are sorted
     * by priority ascending (lower first). Errors thrown from a
     * terminate callback are caught and logged so a single broken
     * cleanup can't leak into the next request.
     */
    private function registerTerminateAttributes(): void
    {
        try {
            $forClass = Attributes::forClass(static::class);
        } catch (\LogicException) {
            return;
        }

        $methods = [];

        foreach ($forClass->methodsAttributes as $methodName => $attrs) {
            foreach ($attrs as $attr) {
                if ($attr instanceof OnTerminate) {
                    $methods[] = ['method' => $methodName, 'priority' => $attr->priority];
                }
            }
        }

        if ($methods === []) {
            return;
        }

        usort($methods, static fn (array $a, array $b): int => $a['priority'] <=> $b['priority']);

        foreach ($methods as $entry) {
            $methodName = $entry['method'];

            $this->app->terminating(function () use ($methodName): void {
                try {
                    $this->{$methodName}();
                } catch (\Throwable $e) {
                    logger()->error("[Module: {$this->resolvedModuleName}] #[OnTerminate] {$methodName}() failed", [
                        'error' => $e->getMessage(),
                    ]);
                }
            });

            $this->debugLog("Registered #[OnTerminate] on {$methodName}()");
        }
    }
}
