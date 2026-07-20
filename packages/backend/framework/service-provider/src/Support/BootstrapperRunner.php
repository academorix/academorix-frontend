<?php

declare(strict_types=1);

namespace Academorix\ServiceProvider\Support;

use Academorix\Foundation\Contracts\Clock;
use Academorix\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Academorix\ServiceProvider\Contracts\BootstrapperInterface;
use Academorix\ServiceProvider\Registry\BootstrapperRegistry;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Contracts\Container\Container;
use Illuminate\Support\Carbon;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * Drives every registered bootstrapper through its cache-aware lifecycle.
 *
 * ## What this class owns
 *
 *  * The `run()` sweep — iterate the {@see BootstrapperRegistry} in
 *    priority order, resolve each class through the container, and
 *    orchestrate the cache-hit / cache-miss / populate / persist
 *    dance.
 *  * Error isolation — a failing bootstrapper logs at ERROR and the
 *    runner CONTINUES with the next one. Boot never halts.
 *  * The completion log — one INFO summary line with total /
 *    hits / misses / errors / duration_ms so ops can spot regressions.
 *
 * ## Cache flow (per bootstrapper)
 *
 *  1. `isCacheable() === false` → call `populate()` directly. Cache
 *     never touched.
 *  2. Cacheable + cache hit → hand the payload to `hydrateFromCachePayload()`.
 *     A `true` return skips `populate()`. A `false` return signals a
 *     stale payload — fall through.
 *  3. Cacheable + cache miss (or stale) → call `populate()`, then
 *     write `extractCachePayload()` to the cache under `cacheKey()`
 *     with TTL `cacheTtl()`. A `null` payload skips the write.
 *
 * ## Octane safety
 *
 * `#[Singleton]` — the runner is stateless between invocations.
 * Every `run()` call is a fresh sweep; no per-request or per-tenant
 * state is captured. Cache reads/writes go through the container-injected
 * {@see Repository} which itself is scoped correctly by Laravel.
 *
 * @see BootstrapperRegistry Registry the runner iterates.
 * @see AbstractBootstrapper Base class supplying the cache hooks.
 *
 * @category Bootstrapper
 *
 * @since    0.1.0
 */
#[Singleton]
final class BootstrapperRunner
{
    /**
     * @param  BootstrapperRegistry  $registry  Registry of class-strings to iterate.
     * @param  Container  $container  Resolves each bootstrapper class.
     * @param  Repository  $cache  Framework cache — read/write of `bootstrapper.*` slots.
     * @param  LoggerInterface  $log  Structured logger for per-bootstrapper duration + summary line.
     * @param  Clock  $clock  Deterministic clock — powers the duration measurements.
     */
    /**
     * One-shot guard — the sweep runs exactly once per worker.
     *
     * Every module provider's `bootModule()` calls {@see run()} at
     * the top of its boot phase to guarantee ordering; the guard
     * lets the FIRST call actually sweep and the subsequent ones
     * short-circuit. Test scenarios that need a fresh sweep can
     * call {@see reset()} to flip the guard back.
     */
    private bool $hasRun = false;

    public function __construct(
        private readonly BootstrapperRegistry $registry,
        private readonly Container $container,
        #[Cache] private readonly Repository $cache,
        #[Log] private readonly LoggerInterface $log,
        private readonly Clock $clock,
    ) {}

    /**
     * Iterate the registry and drive every bootstrapper through its
     * cache-aware lifecycle.
     *
     * Never throws — bootstrapper-level errors are logged and swallowed
     * so a single broken class cannot block boot. The final INFO line
     * summarises the sweep for ops dashboards. Repeat invocations
     * within the same worker short-circuit via the {@see $hasRun}
     * guard.
     */
    public function run(): void
    {
        if ($this->hasRun) {
            return;
        }

        $this->hasRun = true;
        $overallStart = $this->clock->now();
        $total = 0;
        $hits = 0;
        $misses = 0;
        $errors = 0;

        foreach ($this->registry->all() as $class) {
            $total++;

            try {
                $result = $this->runOne($class);
                $result ? $hits++ : $misses++;
            } catch (Throwable $e) {
                $errors++;
                $this->log->error('bootstrapper failed', [
                    'class' => $class,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        $this->log->info('bootstrapper run complete', [
            'total' => $total,
            'hits' => $hits,
            'misses' => $misses,
            'errors' => $errors,
            'duration_ms' => $this->elapsedMs($overallStart),
        ]);
    }

    /**
     * Run one bootstrapper through its cache-aware lifecycle.
     *
     * @param  class-string<BootstrapperInterface>  $class
     * @return bool `true` on cache hit (populate skipped), `false` on miss (populate ran).
     */
    private function runOne(string $class): bool
    {
        $start = $this->clock->now();

        /** @var BootstrapperInterface $bootstrapper */
        $bootstrapper = $this->container->make($class);
        $name = $bootstrapper->name();

        if (! $bootstrapper->isCacheable()) {
            $bootstrapper->populate();
            $this->log->info('bootstrapper ran', [
                'class' => $class,
                'name' => $name,
                'cacheable' => false,
                'hit' => false,
                'duration_ms' => $this->elapsedMs($start),
            ]);

            return false;
        }

        $cacheKey = $bootstrapper->cacheKey();
        $payload = $this->cache->get($cacheKey);

        if ($payload !== null
            && $bootstrapper instanceof AbstractBootstrapper
            && $bootstrapper->hydrateFromCachePayload($payload)
        ) {
            $this->log->info('bootstrapper ran', [
                'class' => $class,
                'name' => $name,
                'cacheable' => true,
                'hit' => true,
                'cache_key' => $cacheKey,
                'duration_ms' => $this->elapsedMs($start),
            ]);

            return true;
        }

        // Cache miss OR stale payload → run populate() and persist.
        $bootstrapper->populate();

        $freshPayload = $bootstrapper instanceof AbstractBootstrapper
            ? $bootstrapper->extractCachePayload()
            : null;

        if ($freshPayload !== null) {
            $ttl = $bootstrapper->cacheTtl();

            if ($ttl === null) {
                $this->cache->forever($cacheKey, $freshPayload);
            } else {
                $this->cache->put($cacheKey, $freshPayload, $ttl);
            }
        }

        $this->log->info('bootstrapper ran', [
            'class' => $class,
            'name' => $name,
            'cacheable' => true,
            'hit' => false,
            'cache_key' => $cacheKey,
            'wrote_payload' => $freshPayload !== null,
            'duration_ms' => $this->elapsedMs($start),
        ]);

        return false;
    }

    /**
     * Elapsed milliseconds between `$start` and now, rounded to the
     * nearest integer.
     */
    private function elapsedMs(Carbon $start): int
    {
        return (int) round(($this->clock->now()->getTimestampMs() - $start->getTimestampMs()));
    }

    /**
     * Reset the one-shot guard so a subsequent {@see run()} call
     * sweeps fresh.
     *
     * @internal Test-suite hook; production code should never call this.
     */
    public function reset(): void
    {
        $this->hasRun = false;
    }
}
