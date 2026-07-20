<?php

declare(strict_types=1);

namespace Academorix\ServiceProvider\Bootstrappers;

use Academorix\Foundation\Contracts\DiscoversAttributes;
use Academorix\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Container\Container;
use Psr\Log\LoggerInterface;
use ReflectionClass;
use Throwable;

/**
 * Meta-bootstrapper — the generic pump for every `#[HydratesFrom]`
 * declaration in the monorepo.
 *
 * ## Why "meta"
 *
 * Every domain package that ships an `#[AsX]` catalogue used to
 * hand-roll its own discovery bootstrapper: inject
 * {@see DiscoversAttributes} + the target registry, iterate the
 * attribute targets, call `$registry->register(...)`. Ten near-
 * identical classes across the modules — pure boilerplate whose only
 * variables are the ATTRIBUTE to scan, the REGISTRY to hydrate, and
 * the METHOD to call.
 *
 * Those three knobs now live on the registry INTERFACE itself as
 * a {@see HydratesFrom} attribute on its `register()` method. This
 * bootstrapper scans every method carrying `#[HydratesFrom]`, resolves
 * the declaring interface from the container, walks the discovered
 * targets of the attribute the method wants, and calls the method
 * with `(class_name, attribute_instance)`.
 *
 * Result: every domain registry gets hydrated at boot with ZERO
 * per-module bootstrapper classes. The registry's own `register()`
 * method owns the "how" — in-memory map, `Artisan::add()`,
 * `Route::addRoute()`, `Gate::policy()`, whatever the domain needs.
 *
 * ## Priority `-900`
 *
 * Sits in the meta-bootstrapper band per
 * `.kiro/steering/bootstrappers.md` — after
 * {@see BootstrapperDiscoveryBootstrapper} (-1000, which populates
 * the bootstrapper registry itself) and before every domain
 * bootstrapper (100+). By the time hydration runs, every `#[AsX]`
 * target that domain code will consume is present in the olvlvl
 * manifest; nothing depends on hydration output landing yet, so no
 * ordering conflict with later bootstrappers.
 *
 * ## Cache lifecycle
 *
 * `isCacheable()` returns `true`. On a cache miss the pump does the
 * full scan + register loop and produces a payload of every
 * `(interface, method, target_class, attribute_state)` tuple it
 * touched. On a cache hit the payload re-plays the same calls
 * against the same registries — skips the olvlvl scan entirely.
 *
 * `php artisan bootstrap:cache` snapshots the payload; deploy
 * boot becomes a two-file require of `vendor/attributes.php`
 * (olvlvl output) + `bootstrap/cache/bootstrappers.*` (this
 * bootstrapper's output).
 *
 * ## Failure isolation
 *
 * Individual hydration errors (unresolvable interface, throwing
 * `register()` method, invalid attribute state) log at WARNING and
 * continue. A single misconfigured registry MUST NOT halt boot.
 *
 * @see HydratesFrom Attribute the pump scans for.
 * @see DiscoversAttributes The seam that reads the olvlvl manifest.
 * @see BootstrapperDiscoveryBootstrapper Sibling meta-bootstrapper.
 *
 * @category Bootstrapper
 *
 * @since    0.1.0
 */
#[Singleton]
final class HydrationBootstrapper extends AbstractBootstrapper
{
    /**
     * @param  DiscoversAttributes  $discovery
     *   Shared attribute-discovery seam — reads the olvlvl manifest
     *   at O(1) per lookup.
     * @param  Container  $container
     *   Resolves each registry interface at hydration time. The
     *   interface is bound to its concrete via `#[Bind]` on the
     *   interface itself (Pattern A per `.kiro/steering/php-attributes.md`).
     * @param  LoggerInterface  $log
     *   Structured logger for per-registry duration + summary line.
     */
    public function __construct(
        private readonly DiscoversAttributes $discovery,
        private readonly Container $container,
        #[Log] private readonly LoggerInterface $log,
    ) {}

    /**
     * {@inheritDoc}
     *
     * Stable machine name — matches the framework namespace so log
     * lines carry a common prefix and `bootstrap:clear` scoping
     * works uniformly.
     */
    public function name(): string
    {
        return 'framework.hydration';
    }

    /**
     * {@inheritDoc}
     *
     * `-900` — meta-bootstrapper band. Runs after
     * {@see BootstrapperDiscoveryBootstrapper} (`-1000`) and before
     * every domain bootstrapper (`100`+).
     */
    public function priority(): int
    {
        return -900;
    }

    /**
     * {@inheritDoc}
     *
     * Scan every method carrying {@see HydratesFrom}, resolve the
     * declaring interface, iterate targets of the referenced
     * attribute, and call the method with `(class_name, attribute)`.
     *
     * Ordering: bindings sorted by their attribute's `priority`
     * argument (ASC) so a downstream registry that depends on an
     * upstream one's state can express the sequence declaratively.
     */
    public function populate(): void
    {
        $bindings = $this->collectBindings();
        $totalHydrated = 0;

        foreach ($bindings as $binding) {
            $count = $this->hydrateBinding(
                $binding['interface'],
                $binding['method'],
                $binding['attribute'],
            );

            $totalHydrated += $count;
        }

        $this->log->info('hydration run complete', [
            'bindings' => \count($bindings),
            'total_targets' => $totalHydrated,
        ]);
    }

    /**
     * {@inheritDoc}
     *
     * Serialize every hydration binding + its resolved targets so
     * subsequent boots re-play the same `register()` calls against
     * the same registries without touching the olvlvl manifest.
     *
     * Shape: `list<{interface, method, priority, targets: list<{class, attribute}>}>`.
     * Attributes are `serialize()`'d because they're readonly value
     * objects whose constructor args aren't uniformly exposed for
     * reconstruction; `unserialize()` re-hydrates them cleanly at
     * cache-hit time.
     */
    protected function toCachePayload(): mixed
    {
        $bindings = $this->collectBindings();
        $payload = [];

        foreach ($bindings as $binding) {
            $targets = [];

            foreach ($this->discovery->forClass($binding['attribute']->attribute) as $target) {
                $targets[] = [
                    'class' => $target->className,
                    'attribute' => \serialize($target->attribute),
                ];
            }

            $payload[] = [
                'interface' => $binding['interface'],
                'method' => $binding['method'],
                'priority' => $binding['attribute']->priority,
                'targets' => $targets,
            ];
        }

        return $payload;
    }

    /**
     * {@inheritDoc}
     *
     * Replay every `(class, attribute)` tuple against its registry
     * via the same method-call the live scan would have made.
     * Returns `false` on any structural mismatch so the runner
     * falls back to a fresh `populate()`.
     */
    protected function fromCachePayload(mixed $payload): bool
    {
        if (! \is_array($payload)) {
            return false;
        }

        $totalHydrated = 0;

        foreach ($payload as $binding) {
            if (! \is_array($binding)) {
                return false;
            }

            $interface = $binding['interface'] ?? null;
            $method = $binding['method'] ?? null;
            $targets = $binding['targets'] ?? null;

            if (! \is_string($interface) || ! \is_string($method) || ! \is_array($targets)) {
                return false;
            }

            try {
                $registry = $this->container->make($interface);
            } catch (Throwable $e) {
                $this->log->warning('hydration cache: registry unresolvable', [
                    'interface' => $interface,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
                continue;
            }

            foreach ($targets as $target) {
                if (! \is_array($target)
                    || ! \is_string($target['class'] ?? null)
                    || ! \is_string($target['attribute'] ?? null)
                ) {
                    continue;
                }

                try {
                    $attribute = \unserialize($target['attribute']);
                    $registry->{$method}($target['class'], $attribute);
                    $totalHydrated++;
                } catch (Throwable $e) {
                    $this->log->warning('hydration cache: replay failed', [
                        'interface' => $interface,
                        'method' => $method,
                        'class' => $target['class'],
                        'exception' => $e::class,
                        'message' => $e->getMessage(),
                    ]);
                }
            }
        }

        $this->log->info('hydration cache replayed', [
            'bindings' => \count($payload),
            'total_targets' => $totalHydrated,
        ]);

        return true;
    }

    /**
     * Collect every `#[HydratesFrom]` declaration in the codebase,
     * ordered by the attribute's `priority` argument (ASC).
     *
     * @return list<array{interface: string, method: string, attribute: HydratesFrom}>
     */
    private function collectBindings(): array
    {
        $bindings = [];

        foreach ($this->discovery->forMethod(HydratesFrom::class) as $target) {
            if (! ($target->attribute instanceof HydratesFrom)) {
                continue;
            }

            $bindings[] = [
                'interface' => $target->className,
                'method' => $target->methodName,
                'attribute' => $target->attribute,
            ];
        }

        \usort(
            $bindings,
            static fn (array $a, array $b): int => $a['attribute']->priority <=> $b['attribute']->priority,
        );

        return $bindings;
    }

    /**
     * Resolve one registry interface, iterate every target of its
     * declared attribute, and call the method with
     * `(class_name, attribute_instance)`. Errors log + skip.
     *
     * @param  string  $interface  Interface class-string to resolve.
     * @param  string  $method  Method name on the resolved registry to call per target.
     * @param  HydratesFrom  $binding  The attribute driving this hydration pass.
     * @return int  Count of targets successfully registered.
     */
    private function hydrateBinding(string $interface, string $method, HydratesFrom $binding): int
    {
        try {
            $registry = $this->container->make($interface);
        } catch (Throwable $e) {
            $this->log->warning('hydration: registry unresolvable', [
                'interface' => $interface,
                'method' => $method,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return 0;
        }

        // Guard against a misconfigured binding — the resolved concrete
        // must actually implement the method we're about to call.
        try {
            $reflection = new ReflectionClass($registry);
            if (! $reflection->hasMethod($method)) {
                $this->log->warning('hydration: registry lacks method', [
                    'interface' => $interface,
                    'method' => $method,
                ]);

                return 0;
            }
        } catch (Throwable) {
            // Fall through — proceed with the call and let the try/catch
            // per target handle any resulting error.
        }

        $count = 0;

        foreach ($this->discovery->forClass($binding->attribute) as $target) {
            try {
                $registry->{$method}($target->className, $target->attribute);
                $count++;
            } catch (Throwable $e) {
                $this->log->warning('hydration: register failed', [
                    'interface' => $interface,
                    'method' => $method,
                    'class' => $target->className,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        $this->log->info('hydration complete for binding', [
            'interface' => $interface,
            'method' => $method,
            'attribute' => $binding->attribute,
            'count' => $count,
        ]);

        return $count;
    }
}
