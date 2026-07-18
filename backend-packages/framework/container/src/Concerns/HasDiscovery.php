<?php

declare(strict_types=1);

/**
 * @file packages/framework/container/src/Concerns/HasDiscovery.php
 *
 * @description
 * Runtime fallback for discovering + registering classes marked with
 * {@see \Academorix\Container\Attributes\Overrides} — the Pattern B
 * container-binding attribute the Academorix framework ships to
 * complement Laravel's canonical
 * {@see \Illuminate\Container\Attributes\Bind}.
 *
 * ## When this runs
 *
 * The container package's `ContainerServiceProvider` composes this
 * trait and invokes `discoverOverriddenClasses()` during `register()`.
 * Runs on every boot in dev; in production this is superseded by a
 * compiled binding manifest emitted by
 * `\Academorix\Container\Compiler\ContainerCompiler` (planned) once
 * `php artisan di:compile` runs.
 *
 *   - Runs: local dev, tests, first boot before `di:compile`, after
 *     `di:clear`.
 *   - Does NOT run: production with the compiled manifest present.
 *
 * ## Why this exists at all
 *
 * Laravel's canonical `#[Bind(Concrete::class)]` goes ON the abstract,
 * so it requires source ownership of the abstract. `#[Overrides]`
 * flips the placement: the attribute lives ON the concrete with the
 * abstract as its argument, so a subclass or implementer can declare
 * a container substitution without touching the abstract's source
 * (or being able to — vendor classes, third-party interfaces).
 *
 * This trait's discovery pass reads every `#[Overrides]` target and
 * writes `$app->bind($abstract, $concrete)` — the same shape a
 * hand-rolled `$this->app->bind(...)` in `register()` would produce,
 * but declaratively colocated with the concrete.
 *
 * ## Lifetime + environment awareness
 *
 * The scanner reads two Laravel-canonical companion attributes on the
 * same concrete:
 *
 *   - {@see \Illuminate\Container\Attributes\Singleton} → promotes the
 *     registration to `$app->singleton(...)`.
 *   - {@see \Illuminate\Container\Attributes\Scoped} → promotes to
 *     `$app->scoped(...)`.
 *
 * `#[Overrides]`'s own `environments` argument filters the binding to
 * a subset of app environments (`['prod']`, `['local', 'testing']`).
 *
 * ## Usage
 *
 * ```php
 * use Academorix\Container\Concerns\HasDiscovery;
 * use Academorix\ServiceProvider\Attributes\Module;
 * use Academorix\ServiceProvider\Providers\ServiceProvider;
 *
 * #[Module(name: 'Container', priority: 1)]
 * final class ContainerServiceProvider extends ServiceProvider
 * {
 *     use HasDiscovery;
 *
 *     public function register(): void
 *     {
 *         parent::register();
 *         $this->discoverOverriddenClasses();
 *     }
 * }
 * ```
 *
 * @see \Academorix\Container\Attributes\Overrides The attribute this trait discovers.
 * @see \Illuminate\Container\Attributes\Bind Canonical Laravel counterpart (Pattern A).
 *
 * @category Concerns
 *
 * @since    1.0.0
 */

namespace Academorix\Container\Concerns;

use Academorix\Container\Attributes\Overrides;
use Academorix\Foundation\Contracts\DiscoversAttributes;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Container\Attributes\Singleton;
use ReflectionClass;
use Throwable;

/**
 * Discovery pass for classes carrying {@see Overrides}.
 *
 * Composed by service providers that own container-override wiring.
 * Never composed by domain modules — override declarations belong
 * next to the concrete they wire.
 *
 * ## Discovery seam
 *
 * Routes through {@see DiscoversAttributes} — the ONE canonical
 * contract every consumer package uses (backed by olvlvl's
 * composer-attribute-collector manifest). Never touches a
 * package-specific facade directly; swapping the backend is a
 * single container rebind, not a codebase-wide edit.
 *
 * @see DiscoversAttributes Canonical attribute-discovery contract.
 * @see Overrides Pattern B container-binding attribute this trait discovers.
 */
trait HasDiscovery
{
    /**
     * Discover + register every class carrying {@see Overrides}.
     *
     * For each hit: reads the attribute's `abstract` argument, reads
     * `#[Singleton]` / `#[Scoped]` lifetime markers on the same class,
     * checks environment eligibility, and dispatches to the container
     * with the appropriate lifetime.
     *
     * Environment filtering rules:
     *   - `environments: ['*']` (default) → always registers.
     *   - `environments: ['prod', 'staging']` → registers only when
     *     `app()->environment('prod', 'staging')` returns true.
     *   - Empty environment list is refused at attribute-construction
     *     time (InvalidArgumentException), so this method never sees it.
     */
    protected function discoverOverriddenClasses(): void
    {
        /** @var DiscoversAttributes $discovery */
        $discovery = $this->app->make(DiscoversAttributes::class);

        foreach ($discovery->forClass(Overrides::class) as $target) {
            if (! ($target->attribute instanceof Overrides)) {
                continue;
            }

            $class = $target->className;

            try {
                $reflection = new ReflectionClass($class);
            } catch (Throwable) {
                // Unreadable class — skip; fail-soft per discovery.md.
                continue;
            }

            $isSingleton = $reflection->getAttributes(Singleton::class) !== [];
            $isScoped = $reflection->getAttributes(Scoped::class) !== [];

            // A class may carry multiple #[Overrides] (IS_REPEATABLE)
            // — one for each abstract it substitutes for. Iterate
            // every attribute instance the discovery layer returned
            // for THIS class so every abstract lands in the container.
            $overrides = $reflection->getAttributes(Overrides::class);

            foreach ($overrides as $overrideAttribute) {
                /** @var Overrides $override */
                $override = $overrideAttribute->newInstance();

                // Environment gate — skip when the current app env
                // isn't in the attribute's allow-list. `'*'` is the
                // wildcard that always passes.
                if (
                    $override->environments !== []
                    && ! \in_array('*', $override->environments, true)
                    && ! $this->app->environment($override->environments)
                ) {
                    continue;
                }

                // Dispatch with the appropriate lifetime. Singleton
                // wins over Scoped when both are present — same
                // precedence Laravel applies internally.
                if ($isSingleton) {
                    $this->app->singleton($override->abstract, $class);
                } elseif ($isScoped) {
                    $this->app->scoped($override->abstract, $class);
                } else {
                    $this->app->bind($override->abstract, $class);
                }
            }
        }
    }
}
