<?php

/**
 * @file packages/scheduling/tests/Unit/ScheduleRegistrarTest.php
 *
 * @description
 * Exercises {@see \Stackra\Scheduling\Support\ScheduleRegistrar}
 * — the layer that turns a {@see \Stackra\Scheduling\Support\ScheduledTask}
 * list into concrete calls on Laravel's `Schedule` builder.
 *
 * ## Testing strategy
 *
 * We do NOT boot Testbench. Laravel's `Schedule` +
 * `Event` classes have complex constructors, so we hand the
 * registrar an anonymous scheduler spy that records every method
 * invocation on the returned event. That gives us an assertion
 * target for "was `withoutOverlapping()` called with the right
 * TTL?" without needing a running app.
 *
 * ## What each group locks in
 *
 *   - **Cadence dispatch** — named frequencies invoke the
 *     matching Event method; raw cron expressions invoke
 *     `->cron($expr)`.
 *   - **Command vs Job routing** — the registrar picks
 *     `command()` when the task's `isCommand` flag is true.
 *   - **Modifier layering** — each modifier flag translates
 *     into exactly one builder call, in the documented order.
 *   - **Gate resolution** — the registrar resolves gates from
 *     the container per tick, never at registration time.
 *   - **Default timezone fallback** — a task without an
 *     explicit `#[Timezone]` picks up the registrar's default.
 */

declare(strict_types=1);

use Stackra\Scheduling\Contracts\ScheduleGate;
use Stackra\Scheduling\Enums\Frequency;
use Stackra\Scheduling\Support\ScheduleDiscovery;
use Stackra\Scheduling\Support\ScheduledTask;
use Stackra\Scheduling\Support\ScheduleRegistrar;
use Illuminate\Container\Container;

/**
 * Record of a single method invocation on the event spy —
 * inserted into the ordered log the tests assert against.
 */
final class RegistrarTest_Invocation
{
    /**
     * @param  string  $method  Name of the invoked builder method.
     * @param  array<int, mixed>  $args    Positional arguments passed to it.
     */
    public function __construct(
        public readonly string $method,
        public readonly array $args,
    ) {}
}

/**
 * Anonymous event spy — every builder method returns `$this`
 * and appends to the shared invocation log so tests can assert
 * on both count + ordering.
 */
function registrarTest_makeEvent(array &$log): object
{
    return new class($log) extends \Illuminate\Console\Scheduling\Event
    {
        /** @param array<int, RegistrarTest_Invocation> $log */
        public function __construct(private array &$log) {}

        private function record(string $method, mixed ...$args): static
        {
            $this->log[] = new RegistrarTest_Invocation($method, $args);

            return $this;
        }

        public function everyMinute(): static { return $this->record('everyMinute'); }
        public function everyTwoMinutes(): static { return $this->record('everyTwoMinutes'); }
        public function everyFiveMinutes(): static { return $this->record('everyFiveMinutes'); }
        public function everyTenMinutes(): static { return $this->record('everyTenMinutes'); }
        public function everyFifteenMinutes(): static { return $this->record('everyFifteenMinutes'); }
        public function everyThirtyMinutes(): static { return $this->record('everyThirtyMinutes'); }
        public function hourly(): static { return $this->record('hourly'); }
        public function daily(): static { return $this->record('daily'); }
        public function weekly(): static { return $this->record('weekly'); }
        public function monthly(): static { return $this->record('monthly'); }
        public function quarterly(): static { return $this->record('quarterly'); }
        public function yearly(): static { return $this->record('yearly'); }

        public function cron($expression): static { return $this->record('cron', $expression); }

        public function withoutOverlapping($expiresAt = 1440, $releaseOnTerminationSignals = true): static { return $this->record('withoutOverlapping', $expiresAt); }
        public function onOneServer(): static { return $this->record('onOneServer'); }
        public function runInBackground(): static { return $this->record('runInBackground'); }
        public function environments($environments): static { return $this->record('environments', $environments); }
        public function evenInMaintenanceMode(): static { return $this->record('evenInMaintenanceMode'); }
        public function timezone($timezone): static { return $this->record('timezone', $timezone); }
        public function when($callback): static { return $this->record('when', $callback); }
        public function name($description): static { return $this->record('name', $description); }
    };
}

/**
 * Anonymous scheduler stub — records whether `job()` or
 * `command()` was called and returns the shared event spy so
 * modifier calls funnel into the same invocation log.
 */
function registrarTest_makeSchedule(array &$log, object $event): object
{
    return new class($log, $event) extends \Illuminate\Console\Scheduling\Schedule
    {
        /** @param array<int, RegistrarTest_Invocation> $log */
        public function __construct(private array &$log, private readonly object $event)
        {
            // Skip parent constructor — we never invoke the real scheduler.
        }

        public function job($job, $queue = null, $connection = null): mixed
        {
            $this->log[] = new RegistrarTest_Invocation('job', [$job]);

            return $this->event;
        }

        public function command($command, array $parameters = []): mixed
        {
            $this->log[] = new RegistrarTest_Invocation('command', [$command]);

            return $this->event;
        }
    };
}

/**
 * Anonymous discovery stub — returns a canned list without
 * touching the composer manifest.
 */
function registrarTest_makeDiscovery(array $tasks): ScheduleDiscovery
{
    return new class($tasks) extends ScheduleDiscovery
    {
        /** @param list<ScheduledTask> $tasks */
        public function __construct(private readonly array $tasks) {}

        public function discover(): array
        {
            return $this->tasks;
        }
    };
}

/**
 * Build a bare {@see ScheduledTask} — most modifier fields
 * default off so individual tests toggle only the flag they
 * exercise.
 *
 * @param  array<string, mixed>  $overrides
 */
function registrarTest_makeTask(array $overrides = []): ScheduledTask
{
    $defaults = [
        'className' => 'App\\Jobs\\NoopJob',
        'isCommand' => false,
        'frequency' => Frequency::Daily,
        'cronExpression' => null,
        'withoutOverlapping' => false,
        'overlapTtlMinutes' => null,
        'onOneServer' => false,
        'runInBackground' => false,
        'environments' => [],
        'runInMaintenanceMode' => false,
        'timezone' => null,
        'gates' => [],
        'name' => null,
    ];

    /** @var array<string, mixed> $merged */
    $merged = array_replace($defaults, $overrides);

    return new ScheduledTask(
        className: $merged['className'],
        isCommand: $merged['isCommand'],
        frequency: $merged['frequency'],
        cronExpression: $merged['cronExpression'],
        withoutOverlapping: $merged['withoutOverlapping'],
        overlapTtlMinutes: $merged['overlapTtlMinutes'],
        onOneServer: $merged['onOneServer'],
        runInBackground: $merged['runInBackground'],
        environments: $merged['environments'],
        runInMaintenanceMode: $merged['runInMaintenanceMode'],
        timezone: $merged['timezone'],
        gates: $merged['gates'],
        name: $merged['name'],
    );
}

// -----------------------------------------------------------------
// Group 1 — cadence dispatch
// -----------------------------------------------------------------

it('routes a Job task through Schedule::job() with the named cadence', function (): void {
    // A vanilla `#[Schedule(Frequency::Daily)]` on a Job class
    // should produce: job() → daily(). Nothing else on the log.
    $log = [];
    $event = registrarTest_makeEvent($log);
    $schedule = registrarTest_makeSchedule($log, $event);

    $registrar = new ScheduleRegistrar(
        container: new Container,
        discovery: registrarTest_makeDiscovery([registrarTest_makeTask()]),
        cachePath: null,
        cacheEnabled: false,
    );

    $registrar->register($schedule);

    expect($log)->toHaveCount(2)
        ->and($log[0]->method)->toBe('job')
        ->and($log[0]->args[0])->toBe('App\\Jobs\\NoopJob')
        ->and($log[1]->method)->toBe('daily');
});

it('routes a Command task through Schedule::command()', function (): void {
    // `isCommand` toggles the routing — the log should start
    // with `command`, not `job`.
    $log = [];
    $event = registrarTest_makeEvent($log);
    $schedule = registrarTest_makeSchedule($log, $event);

    $registrar = new ScheduleRegistrar(
        container: new Container,
        discovery: registrarTest_makeDiscovery([
            registrarTest_makeTask(['isCommand' => true, 'frequency' => Frequency::Hourly]),
        ]),
        cachePath: null,
        cacheEnabled: false,
    );

    $registrar->register($schedule);

    expect($log[0]->method)->toBe('command')
        ->and($log[1]->method)->toBe('hourly');
});

it('routes a #[Cron] task through ->cron($expression)', function (): void {
    // Raw cron expressions bypass the enum and land on
    // `->cron($expr)`. The cadence log entry carries the raw
    // string as an argument so callers can grep for it.
    $log = [];
    $event = registrarTest_makeEvent($log);
    $schedule = registrarTest_makeSchedule($log, $event);

    $registrar = new ScheduleRegistrar(
        container: new Container,
        discovery: registrarTest_makeDiscovery([
            registrarTest_makeTask([
                'frequency' => null,
                'cronExpression' => '*/15 9-17 * * 1-5',
            ]),
        ]),
        cachePath: null,
        cacheEnabled: false,
    );

    $registrar->register($schedule);

    expect($log[1]->method)->toBe('cron')
        ->and($log[1]->args[0])->toBe('*/15 9-17 * * 1-5');
});

// -----------------------------------------------------------------
// Group 2 — modifier layering
// -----------------------------------------------------------------

it('applies every modifier in the documented order', function (): void {
    // Spec ordering: withoutOverlapping, onOneServer,
    // runInBackground, environments, evenInMaintenanceMode,
    // timezone, when, name. Any reordering here would silently
    // change semantics — e.g. `name()` before
    // `withoutOverlapping()` changes the overlap lock key.
    $log = [];
    $event = registrarTest_makeEvent($log);
    $schedule = registrarTest_makeSchedule($log, $event);

    $registrar = new ScheduleRegistrar(
        container: new Container,
        discovery: registrarTest_makeDiscovery([
            registrarTest_makeTask([
                'withoutOverlapping' => true,
                'overlapTtlMinutes' => 5,
                'onOneServer' => true,
                'runInBackground' => true,
                'environments' => ['production', 'staging'],
                'runInMaintenanceMode' => true,
                'timezone' => 'Africa/Casablanca',
                'name' => 'multi-modifier-task',
            ]),
        ]),
        cachePath: null,
        cacheEnabled: false,
    );

    $registrar->register($schedule);

    // Drop the setup entries (job + cadence) and assert only on
    // the modifier tail.
    $methods = array_map(static fn (RegistrarTest_Invocation $i): string => $i->method, $log);

    expect($methods)->toBe([
        'job',
        'daily',
        'withoutOverlapping',
        'onOneServer',
        'runInBackground',
        'environments',
        'evenInMaintenanceMode',
        'timezone',
        'name',
    ]);
});

it('passes the TTL to withoutOverlapping when provided', function (): void {
    // A `null` TTL uses Laravel's default (1440 minutes = 24h).
    // Passing an explicit value must forward through so the
    // overlap lock stays bounded.
    $log = [];
    $event = registrarTest_makeEvent($log);
    $schedule = registrarTest_makeSchedule($log, $event);

    $registrar = new ScheduleRegistrar(
        container: new Container,
        discovery: registrarTest_makeDiscovery([
            registrarTest_makeTask(['withoutOverlapping' => true, 'overlapTtlMinutes' => 30]),
        ]),
        cachePath: null,
        cacheEnabled: false,
    );

    $registrar->register($schedule);

    $overlap = collect($log)->first(static fn (RegistrarTest_Invocation $i): bool => $i->method === 'withoutOverlapping');

    expect($overlap)->not->toBeNull()
        ->and($overlap->args[0])->toBe(30);
});

// -----------------------------------------------------------------
// Group 3 — gate resolution
// -----------------------------------------------------------------

it('resolves gates from the container at tick time', function (): void {
    // The registrar registers a closure with `->when()`. The
    // closure must resolve the gate from the container LAZILY —
    // if we resolved at registration time, gates would run
    // during boot and could not depend on request-scoped
    // services (which is fine here because the scheduler is
    // CLI, but the lazy contract matters for correctness).
    $log = [];
    $event = registrarTest_makeEvent($log);
    $schedule = registrarTest_makeSchedule($log, $event);

    $container = new Container;
    $container->bind(RegistrarTest_TruthyGate::class, fn () => new RegistrarTest_TruthyGate);

    $registrar = new ScheduleRegistrar(
        container: $container,
        discovery: registrarTest_makeDiscovery([
            registrarTest_makeTask(['gates' => [RegistrarTest_TruthyGate::class]]),
        ]),
        cachePath: null,
        cacheEnabled: false,
    );

    $registrar->register($schedule);

    $when = collect($log)->first(static fn (RegistrarTest_Invocation $i): bool => $i->method === 'when');
    expect($when)->not->toBeNull();

    /** @var Closure $callback */
    $callback = $when->args[0];

    // Invoke the callback — this is exactly what Laravel's
    // scheduler does on each tick. The truthy gate should
    // return true.
    expect($callback())->toBeTrue();
});

/** Test gate that always returns `true`. */
final class RegistrarTest_TruthyGate implements ScheduleGate
{
    public function __invoke(): bool
    {
        return true;
    }
}

// -----------------------------------------------------------------
// Group 4 — default timezone fallback
// -----------------------------------------------------------------

it('falls back to the default timezone when a task lacks #[Timezone]', function (): void {
    // The registrar carries an app-wide default. A task without
    // an explicit timezone picks it up so the scheduler evaluates
    // the cron expression in the expected tz.
    $log = [];
    $event = registrarTest_makeEvent($log);
    $schedule = registrarTest_makeSchedule($log, $event);

    $registrar = new ScheduleRegistrar(
        container: new Container,
        discovery: registrarTest_makeDiscovery([registrarTest_makeTask()]),
        cachePath: null,
        cacheEnabled: false,
        defaultTimezone: 'UTC',
    );

    $registrar->register($schedule);

    $timezone = collect($log)->first(static fn (RegistrarTest_Invocation $i): bool => $i->method === 'timezone');
    expect($timezone)->not->toBeNull()
        ->and($timezone->args[0])->toBe('UTC');
});

it('prefers the task timezone over the registrar default', function (): void {
    // Per-task `#[Timezone]` wins. The default should be
    // overridden, not layered.
    $log = [];
    $event = registrarTest_makeEvent($log);
    $schedule = registrarTest_makeSchedule($log, $event);

    $registrar = new ScheduleRegistrar(
        container: new Container,
        discovery: registrarTest_makeDiscovery([
            registrarTest_makeTask(['timezone' => 'Africa/Casablanca']),
        ]),
        cachePath: null,
        cacheEnabled: false,
        defaultTimezone: 'UTC',
    );

    $registrar->register($schedule);

    $timezone = collect($log)->first(static fn (RegistrarTest_Invocation $i): bool => $i->method === 'timezone');
    expect($timezone->args[0])->toBe('Africa/Casablanca');
});

// -----------------------------------------------------------------
// Group 5 — cache round-trip
// -----------------------------------------------------------------

it('writes discovered tasks to the cache path on a cold read', function (): void {
    // Cache warmup contract — the first `register()` call
    // discovers the tasks AND writes the cache file for the
    // next boot to reuse.
    $log = [];
    $event = registrarTest_makeEvent($log);
    $schedule = registrarTest_makeSchedule($log, $event);

    $cache = tempnam(\sys_get_temp_dir(), 'scheduling-cache-');
    \unlink($cache); // Remove the temp file — the registrar creates it.

    $registrar = new ScheduleRegistrar(
        container: new Container,
        discovery: registrarTest_makeDiscovery([registrarTest_makeTask()]),
        cachePath: $cache,
        cacheEnabled: true,
    );

    try {
        $registrar->register($schedule);

        expect(\is_file($cache))->toBeTrue();

        /** @var array<int, array<string, mixed>> $cached */
        $cached = require $cache;

        expect($cached)->toBeArray()
            ->and($cached)->toHaveCount(1)
            ->and($cached[0]['frequency'])->toBe('daily');
    } finally {
        if (\is_file($cache)) {
            @\unlink($cache);
        }
    }
});
