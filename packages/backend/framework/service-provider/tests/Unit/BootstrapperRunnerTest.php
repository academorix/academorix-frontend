<?php

/**
 * @file packages/framework/service-provider/tests/Unit/BootstrapperRunnerTest.php
 *
 * @description
 * Unit coverage for {@see \Academorix\ServiceProvider\Support\BootstrapperRunner}.
 *
 * ## Strategy — pure PHP fakes, no framework boot
 *
 *  * `DiscoversAttributes` is not needed for these tests — the
 *    runner reads from the registry directly.
 *  * The framework cache is an in-memory `ArrayStore` wrapped in
 *    Laravel's `Repository`.
 *  * Logging uses a Psr `NullLogger`-style capturing fake.
 *  * The container is Laravel's own `Container` for cheap
 *    `make()` resolution.
 */

declare(strict_types=1);

namespace Academorix\ServiceProvider\Tests\Unit;

use Academorix\Foundation\Contracts\Clock;
use Academorix\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Academorix\ServiceProvider\Registry\BootstrapperRegistry;
use Academorix\ServiceProvider\Support\BootstrapperRunner;
use Illuminate\Cache\ArrayStore;
use Illuminate\Cache\Repository;
use Illuminate\Container\Container;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\TestCase;
use Psr\Log\AbstractLogger;
use Psr\Log\LoggerInterface;
use Stringable;

/**
 * In-memory PSR-3 logger — captures every entry so tests can
 * assert on level + message + context without spinning up a
 * full logging stack.
 */
final class CapturingLogger extends AbstractLogger
{
    /**
     * @var list<array{level: string, message: string, context: array<string, mixed>}>
     */
    public array $entries = [];

    /**
     * @param  mixed  $level
     * @param  array<string, mixed>  $context
     */
    public function log($level, string|Stringable $message, array $context = []): void
    {
        $this->entries[] = [
            'level' => (string) $level,
            'message' => (string) $message,
            'context' => $context,
        ];
    }
}

/**
 * Deterministic clock — advances time only when `advance()` is called.
 */
final class FixedClock implements Clock
{
    public function __construct(private Carbon $now) {}

    public function now(): Carbon
    {
        return $this->now->clone();
    }

    public function advance(int $ms): void
    {
        $this->now = $this->now->clone()->addMilliseconds($ms);
    }
}

/**
 * Simple domain registry — an ordered list of `class-string`s.
 */
final class RecordingRegistry
{
    /** @var list<string> */
    public array $items = [];

    public function push(string $item): void
    {
        $this->items[] = $item;
    }
}

/**
 * Fixture bootstrapper — records its own name into the shared
 * {@see RecordingRegistry} when `populate()` runs.
 */
final class RecordingBootstrapper extends AbstractBootstrapper
{
    /** @var callable():void|null */
    public $onPopulate = null;

    public bool $cacheable = false;

    public int $priorityOverride = 100;

    public string $nameOverride = 'test.recording';

    public function __construct(public readonly RecordingRegistry $sink) {}

    public function name(): string
    {
        return $this->nameOverride;
    }

    public function priority(): int
    {
        return $this->priorityOverride;
    }

    public function isCacheable(): bool
    {
        return $this->cacheable;
    }

    public function populate(): void
    {
        if ($this->onPopulate !== null) {
            ($this->onPopulate)();
        }

        $this->sink->push($this->name());
    }

    protected function toCachePayload(): mixed
    {
        return $this->sink->items;
    }

    protected function fromCachePayload(mixed $payload): bool
    {
        if (! is_array($payload)) {
            return false;
        }

        /** @var list<string> $payload */
        foreach ($payload as $item) {
            $this->sink->push($item);
        }

        return true;
    }
}

/**
 * Fixture bootstrapper whose `fromCachePayload()` always returns
 * `false` so the runner falls through to `populate()` even on a
 * cache hit.
 */
final class StaleRejectingBootstrapper extends AbstractBootstrapper
{
    public bool $populateCalled = false;

    public int $priorityOverride = 100;

    public function name(): string
    {
        return 'test.stale-rejecting';
    }

    public function priority(): int
    {
        return $this->priorityOverride;
    }

    public function populate(): void
    {
        $this->populateCalled = true;
    }

    protected function toCachePayload(): mixed
    {
        return ['some' => 'payload'];
    }

    protected function fromCachePayload(mixed $payload): bool
    {
        unset($payload);

        return false;
    }
}

/**
 * Fixture bootstrapper that throws inside `populate()`.
 */
final class ExplodingBootstrapper extends AbstractBootstrapper
{
    public int $priorityOverride = 100;

    public function name(): string
    {
        return 'test.exploding';
    }

    public function priority(): int
    {
        return $this->priorityOverride;
    }

    public function isCacheable(): bool
    {
        return false;
    }

    public function populate(): void
    {
        throw new \RuntimeException('boom');
    }
}

/**
 * Unit tests for the runner's cache-aware dispatch.
 */
final class BootstrapperRunnerTest extends TestCase
{
    private Container $container;

    private BootstrapperRegistry $registry;

    private Repository $cache;

    private CapturingLogger $log;

    private FixedClock $clock;

    protected function setUp(): void
    {
        parent::setUp();

        $this->container = new Container;
        $this->cache = new Repository(new ArrayStore);
        $this->log = new CapturingLogger;
        $this->clock = new FixedClock(Carbon::create(2025, 1, 1, 12, 0, 0));
        $this->registry = new BootstrapperRegistry($this->container);

        $this->container->instance(BootstrapperRegistry::class, $this->registry);
        $this->container->instance(Repository::class, $this->cache);
        $this->container->instance(LoggerInterface::class, $this->log);
        $this->container->instance(Clock::class, $this->clock);
    }

    private function makeRunner(): BootstrapperRunner
    {
        return new BootstrapperRunner(
            registry: $this->registry,
            container: $this->container,
            cache: $this->cache,
            log: $this->log,
            clock: $this->clock,
        );
    }

    /**
     * Priority ascending — lower runs first; ties break alphabetical.
     */
    public function test_runs_registered_bootstrappers_in_priority_order(): void
    {
        $sink = new RecordingRegistry;

        $a = new RecordingBootstrapper($sink);
        $a->nameOverride = 'zeta';
        $a->priorityOverride = 200;

        $b = new RecordingBootstrapper($sink);
        $b->nameOverride = 'alpha';
        $b->priorityOverride = 50;

        $classA = 'Fixtures\\A_'.uniqid();
        $classB = 'Fixtures\\B_'.uniqid();

        $this->container->instance($classA, $a);
        $this->container->instance($classB, $b);

        $this->registry->register($classA, 200);
        $this->registry->register($classB, 50);

        $this->makeRunner()->run();

        $this->assertSame(['alpha', 'zeta'], $sink->items);
    }

    /**
     * Cache miss → populate runs → payload written.
     */
    public function test_cache_miss_runs_populate_and_writes_payload(): void
    {
        $sink = new RecordingRegistry;
        $bs = new RecordingBootstrapper($sink);
        $bs->cacheable = true;
        $bs->nameOverride = 'ai.personas';

        $class = 'Fixtures\\Miss_'.uniqid();
        $this->container->instance($class, $bs);
        $this->registry->register($class, 100);

        $this->makeRunner()->run();

        $this->assertSame(['ai.personas'], $sink->items);
        $this->assertNotNull($this->cache->get('bootstrapper.ai.personas'));
    }

    /**
     * Cache hit + fromCachePayload returns true → populate NOT called.
     */
    public function test_cache_hit_skips_populate_when_payload_accepted(): void
    {
        $sink = new RecordingRegistry;
        $bs = new RecordingBootstrapper($sink);
        $bs->cacheable = true;
        $bs->nameOverride = 'ai.personas';
        $bs->onPopulate = function (): void {
            $this->fail('populate() must not run on cache hit + accepted payload');
        };

        $this->cache->forever('bootstrapper.ai.personas', ['cached-persona']);

        $class = 'Fixtures\\Hit_'.uniqid();
        $this->container->instance($class, $bs);
        $this->registry->register($class, 100);

        $this->makeRunner()->run();

        $this->assertSame(['cached-persona'], $sink->items);
    }

    /**
     * Cache hit + fromCachePayload returns false → populate still runs.
     */
    public function test_cache_hit_falls_through_when_payload_rejected(): void
    {
        $bs = new StaleRejectingBootstrapper;

        $this->cache->forever('bootstrapper.test.stale-rejecting', ['stale']);

        $class = 'Fixtures\\Stale_'.uniqid();
        $this->container->instance($class, $bs);
        $this->registry->register($class, 100);

        $this->makeRunner()->run();

        $this->assertTrue($bs->populateCalled);
    }

    /**
     * isCacheable() === false → cache never touched, populate runs.
     */
    public function test_non_cacheable_bootstrapper_never_touches_cache(): void
    {
        $sink = new RecordingRegistry;
        $bs = new RecordingBootstrapper($sink);
        $bs->cacheable = false;
        $bs->nameOverride = 'framework.non-cacheable';

        $class = 'Fixtures\\NonCacheable_'.uniqid();
        $this->container->instance($class, $bs);
        $this->registry->register($class, 100);

        $this->makeRunner()->run();

        $this->assertSame(['framework.non-cacheable'], $sink->items);
        $this->assertNull($this->cache->get('bootstrapper.framework.non-cacheable'));
    }

    /**
     * Errors in one bootstrapper log + continue.
     */
    public function test_error_in_one_bootstrapper_does_not_halt_others(): void
    {
        $sink = new RecordingRegistry;
        $good = new RecordingBootstrapper($sink);
        $good->nameOverride = 'good';
        $good->priorityOverride = 200;
        $good->cacheable = false;

        $bad = new ExplodingBootstrapper;
        $bad->priorityOverride = 100;

        $classGood = 'Fixtures\\Good_'.uniqid();
        $classBad = 'Fixtures\\Bad_'.uniqid();

        $this->container->instance($classGood, $good);
        $this->container->instance($classBad, $bad);

        $this->registry->register($classGood, 200);
        $this->registry->register($classBad, 100);

        $this->makeRunner()->run();

        $this->assertSame(['good'], $sink->items, 'good bootstrapper must still run after bad threw');

        $errorEntries = array_filter(
            $this->log->entries,
            static fn (array $e): bool => $e['level'] === 'error',
        );
        $this->assertNotEmpty($errorEntries, 'runner must log ERROR when a bootstrapper throws');
    }

    /**
     * Duplicate registration is deduplicated at the registry layer.
     */
    public function test_duplicate_registration_is_deduped(): void
    {
        $sink = new RecordingRegistry;
        $bs = new RecordingBootstrapper($sink);
        $bs->cacheable = false;
        $bs->nameOverride = 'once';

        $class = 'Fixtures\\Dupe_'.uniqid();
        $this->container->instance($class, $bs);

        $this->registry->register($class, 100);
        $this->registry->register($class, 100);
        $this->registry->register($class, 200);

        $this->assertSame(1, $this->registry->count());

        $this->makeRunner()->run();

        $this->assertSame(['once'], $sink->items);
    }
}
