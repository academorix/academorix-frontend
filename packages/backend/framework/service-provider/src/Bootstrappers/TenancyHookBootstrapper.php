<?php

declare(strict_types=1);

namespace Academorix\ServiceProvider\Bootstrappers;

use Academorix\Foundation\Contracts\DiscoversAttributes;
use Academorix\ServiceProvider\Attributes\AsBootstrapper;
use Academorix\ServiceProvider\Attributes\AsTenancyHook;
use Academorix\ServiceProvider\Contracts\TenancyHookInterface;
use Academorix\ServiceProvider\Dispatchers\TenancyHookDispatcher;
use Academorix\ServiceProvider\Registry\TenancyHookRegistry;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Psr\Log\LoggerInterface;
use ReflectionClass;
use Throwable;

/**
 * Meta-bootstrapper — populates the {@see TenancyHookRegistry}
 * with every class carrying {@see AsTenancyHook}.
 *
 * ## Concept A (this class) hydrates Concept B (the registry)
 *
 * ADR 0020 formalises the split: this class IS an app-boot
 * {@see AbstractBootstrapper} (Concept A) whose job is to hydrate
 * the per-tenant hook registry (Concept B). Two concepts, two
 * lifecycles, deliberate crossover point.
 *
 * ## Cache participation
 *
 * `isCacheable()` defaults to `true` — the payload is the sorted
 * list of hook class-strings which is safely serializable. Cache
 * hits skip the discovery walk; cache misses re-scan the attribute
 * manifest. `bootstrap:clear` wipes the slot when a new
 * `#[AsTenancyHook]` lands and `composer dump-autoload` runs.
 *
 * ## Priority
 *
 * `-500` — sits AFTER the framework-owned meta-discovery
 * bootstrappers (`-1000`) and BEFORE every domain module
 * (`100+`). The registry MUST be populated by the time domain
 * middleware tries to resolve
 * {@see TenancyHookDispatcher}
 * on the first tenant-scoped request.
 *
 * ## Failure handling
 *
 *  * Discovery pass errors log at WARNING and continue.
 *  * Classes that don't implement {@see TenancyHookInterface} log
 *    a WARNING and are skipped — a `#[AsTenancyHook]` on the wrong
 *    class is a visible-but-non-fatal misconfiguration.
 *  * A discovery pass yielding zero targets logs at INFO — hooks
 *    are optional; some tenants ship without any.
 *
 * @see AsTenancyHook       Attribute this class scans for.
 * @see TenancyHookRegistry Populated target.
 * @see TenancyHookInterface Contract verified via reflection.
 *
 * @category TenancyHook
 *
 * @since    0.1.0
 */
#[AsBootstrapper(priority: -500, module: 'ServiceProvider')]
#[Singleton]
final class TenancyHookBootstrapper extends AbstractBootstrapper
{
    /**
     * @param  DiscoversAttributes  $discovery  Shared attribute-discovery seam.
     * @param  TenancyHookRegistry  $registry  Target registry — mutated by {@see populate()}/{@see fromCachePayload()}.
     * @param  LoggerInterface  $log  Discovery-time diagnostics.
     */
    public function __construct(
        private readonly DiscoversAttributes $discovery,
        private readonly TenancyHookRegistry $registry,
        #[Log] private readonly LoggerInterface $log,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'framework.tenancy-hooks';
    }

    /**
     * {@inheritDoc}
     *
     * `-500` — see class docblock for the ordering rationale.
     */
    public function priority(): int
    {
        return -500;
    }

    /**
     * Scan `#[AsTenancyHook]`, verify each target implements
     * {@see TenancyHookInterface}, and register into the registry.
     *
     * @see AbstractBootstrapper::populate()
     */
    public function populate(): void
    {
        $registered = 0;

        foreach ($this->discovery->forClass(AsTenancyHook::class) as $target) {
            try {
                if (! $target->attribute instanceof AsTenancyHook) {
                    continue;
                }

                if (! $target->attribute->enabled) {
                    continue;
                }

                if (! class_exists($target->className)) {
                    // Stale manifest — a class rename that hasn't
                    // been followed by a fresh `composer dump-autoload`.
                    continue;
                }

                $reflection = new ReflectionClass($target->className);

                if ($reflection->isAbstract()) {
                    continue;
                }

                if (! $reflection->implementsInterface(TenancyHookInterface::class)) {
                    $this->log->warning('#[AsTenancyHook] found on a class that does not implement TenancyHookInterface.', [
                        'class' => $target->className,
                        'expected_interface' => TenancyHookInterface::class,
                    ]);

                    continue;
                }

                /** @var class-string<TenancyHookInterface> $class */
                $class = $target->className;
                $this->registry->register($class, $target->attribute->priority);
                $registered++;
            } catch (Throwable $e) {
                $this->log->warning('tenancy-hook discovery skipped a class', [
                    'class' => $target->className,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        $this->log->info('tenancy-hook discovery complete', [
            'registered' => $registered,
        ]);
    }

    /**
     * Serialize the current registry state — a sorted list of
     * `[class-string, priority]` pairs.
     *
     * The pair shape keeps the cache stable when hooks are added
     * without renaming existing ones: a new class extends the list
     * but existing entries retain their positions.
     *
     * @return list<array{class: class-string<TenancyHookInterface>, priority: int}>|null
     */
    protected function toCachePayload(): mixed
    {
        /** @var list<array{class: class-string<TenancyHookInterface>, priority: int}> $payload */
        $payload = [];

        foreach ($this->registry->all() as $class) {
            // Re-derive priority through the reflection path so
            // the cached shape survives even when the registry
            // internals evolve.
            $priority = $this->priorityFromReflection($class);
            $payload[] = ['class' => $class, 'priority' => $priority];
        }

        return $payload === [] ? null : $payload;
    }

    /**
     * Rehydrate the registry from a cached payload.
     *
     * Every entry re-runs through `register()` which enforces the
     * dedup guard so a stale payload that also arrived through
     * live discovery merges cleanly.
     *
     * @param  mixed  $payload  Expected shape: `list<array{class: class-string, priority: int}>`.
     * @return bool `true` when the payload was valid and applied.
     */
    protected function fromCachePayload(mixed $payload): bool
    {
        if (! is_array($payload)) {
            return false;
        }

        foreach ($payload as $entry) {
            if (! is_array($entry)) {
                return false;
            }

            $class = $entry['class'] ?? null;
            $priority = $entry['priority'] ?? null;

            if (! is_string($class) || ! is_int($priority)) {
                return false;
            }

            if (! class_exists($class)) {
                // Stale cache — a rename since the last write.
                // Fall through to populate().
                return false;
            }

            /** @var class-string<TenancyHookInterface> $class */
            $this->registry->register($class, $priority);
        }

        return true;
    }

    /**
     * Best-effort priority resolution via reflection — reads the
     * `#[AsTenancyHook]` attribute on the class and returns its
     * declared priority. Falls back to `100` on any failure.
     *
     * @param  class-string  $class
     */
    private function priorityFromReflection(string $class): int
    {
        try {
            $reflection = new ReflectionClass($class);

            foreach ($reflection->getAttributes(AsTenancyHook::class) as $attribute) {
                /** @var AsTenancyHook $instance */
                $instance = $attribute->newInstance();

                return $instance->priority;
            }
        } catch (Throwable) {
            // Ignored — falls through to default.
        }

        return 100;
    }
}
