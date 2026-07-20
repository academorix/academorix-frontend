<?php

/**
 * @file packages/scheduling/src/Support/ScheduleRegistrar.php
 *
 * @description
 * Turns the {@see ScheduledTask} list produced by
 * {@see ScheduleDiscovery} into concrete registrations on
 * Laravel's `Schedule` instance. Invoked from
 * {@see \Academorix\Scheduling\Providers\SchedulingServiceProvider}
 * inside `$this->callAfterResolving(Schedule::class, ...)` so the
 * scheduler binding is guaranteed available.
 *
 * ## Registration order per task
 *
 *   1. `Schedule::job()` or `Schedule::command()` — chosen from
 *      the task's `$isCommand` flag which the discovery layer
 *      derives via reflection on `Illuminate\Console\Command`.
 *   2. Apply cadence — either the {@see \Academorix\Scheduling\Enums\Frequency}'s
 *      own `apply()` helper OR `->cron($expression)` for raw
 *      expressions.
 *   3. Layer modifiers, in the order the spec dictates:
 *      `withoutOverlapping`, `onOneServer`, `runInBackground`,
 *      `environments`, `runInMaintenanceMode`, `timezone`,
 *      `when` (gates), `name`.
 *
 * ## Caching
 *
 * When the constructor is handed a `$cachePath` and caching is
 * enabled, the registrar:
 *
 *   - Reads discovered tasks from the cache file when it exists,
 *     skipping the discovery walk entirely.
 *   - Writes the freshly-discovered task array to that path
 *     otherwise, so the next boot short-circuits.
 *
 * ## Octane-safety
 *
 * The registrar itself is stateless — all side effects are
 * scoped to the single `register()` call. Under Octane the
 * scheduler binding is preserved across requests; the registrar
 * is only invoked when the scheduler is first resolved (typically
 * at `php artisan schedule:run` startup, not per-request).
 */

declare(strict_types=1);

namespace Academorix\Scheduling\Support;

use Academorix\Scheduling\Contracts\ScheduleGate;
use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Container\Container;

/**
 * Boot-time task registrar. Stateless once populated — every
 * invocation of {@see register()} produces the same event list
 * from the same manifest input, so a `#[Singleton]` lifetime is
 * safe and shaves per-request container overhead.
 *
 * Constructor parameters are attribute-driven per ADR 0006:
 *
 *   - `$container` / `$discovery` — auto-injected via type hints.
 *   - `$cachePath` — read from `scheduling.discovery.cache_path`;
 *     when null, caching is disabled at runtime.
 *   - `$cacheEnabled` — read from `scheduling.discovery.cache`.
 *   - `$defaultTimezone` — read from `scheduling.timezone`.
 */
#[Singleton]
final class ScheduleRegistrar
{
    /**
     * @param  Container         $container       Container used to resolve gate classes at tick time.
     * @param  ScheduleDiscovery $discovery       Attribute walker — invoked once when the cache is cold.
     * @param  string|null       $cachePath       Absolute path to `bootstrap/cache/scheduling.php`, or `null` to disable caching. Read from `scheduling.discovery.cache_path`.
     * @param  bool              $cacheEnabled    When `false`, discovery runs on every boot and no cache is written. Read from `scheduling.discovery.cache`.
     * @param  string|null       $defaultTimezone Timezone applied when a task does NOT carry `#[Timezone(...)]`; `null` leaves Laravel's default in charge. Read from `scheduling.timezone`.
     */
    public function __construct(
        private readonly Container $container,
        private readonly ScheduleDiscovery $discovery,
        #[Config('scheduling.discovery.cache_path')]
        private readonly ?string $cachePath = null,
        #[Config('scheduling.discovery.cache', true)]
        private readonly bool $cacheEnabled = true,
        #[Config('scheduling.timezone')]
        private readonly ?string $defaultTimezone = null,
    ) {}

    /**
     * Register every discovered task on the supplied scheduler.
     */
    public function register(Schedule $schedule): void
    {
        foreach ($this->tasks() as $task) {
            $this->registerTask($schedule, $task);
        }
    }

    /**
     * Resolve the task list — either from the cache file when
     * caching is on and the cache exists, or by walking the
     * attribute manifest. Fills the cache on a cold read.
     *
     * @return list<ScheduledTask>
     */
    private function tasks(): array
    {
        if ($this->cacheEnabled && $this->cachePath !== null && \is_file($this->cachePath)) {
            /** @var mixed $cached */
            $cached = require $this->cachePath;

            if (\is_array($cached)) {
                $tasks = [];
                foreach ($cached as $row) {
                    if (\is_array($row)) {
                        $tasks[] = ScheduledTask::fromArray($row);
                    }
                }

                return $tasks;
            }
        }

        $tasks = $this->discovery->discover();

        if ($this->cacheEnabled && $this->cachePath !== null) {
            $this->writeCache($this->cachePath, $tasks);
        }

        return $tasks;
    }

    /**
     * Apply one task's cadence + modifiers onto the scheduler.
     */
    private function registerTask(Schedule $schedule, ScheduledTask $task): void
    {
        $event = $task->isCommand
            ? $schedule->command($task->className)
            : $schedule->job($task->className);

        $event = $this->applyCadence($event, $task);
        $event = $this->applyModifiers($event, $task);
    }

    /**
     * Attach the cadence — either a named frequency or a raw
     * cron expression — to the fresh event.
     */
    private function applyCadence(Event $event, ScheduledTask $task): Event
    {
        if ($task->frequency !== null) {
            return $task->frequency->apply($event);
        }

        if ($task->cronExpression !== null) {
            return $event->cron($task->cronExpression);
        }

        // Discovery guarantees exactly one cadence source per
        // task; falling through means the invariant was violated
        // upstream. Leave the event untouched so Laravel's
        // scheduler throws a clearer error than we could.
        return $event;
    }

    /**
     * Layer every modifier attribute onto the event in the spec
     * order: `withoutOverlapping`, `onOneServer`,
     * `runInBackground`, `environments`, `runInMaintenanceMode`,
     * `timezone`, `when` (gates), `name`.
     */
    private function applyModifiers(Event $event, ScheduledTask $task): Event
    {
        if ($task->withoutOverlapping) {
            $event = $task->overlapTtlMinutes !== null
                ? $event->withoutOverlapping($task->overlapTtlMinutes)
                : $event->withoutOverlapping();
        }

        if ($task->onOneServer) {
            $event = $event->onOneServer();
        }

        if ($task->runInBackground) {
            $event = $event->runInBackground();
        }

        if ($task->environments !== []) {
            $event = $event->environments($task->environments);
        }

        if ($task->runInMaintenanceMode) {
            $event = $event->evenInMaintenanceMode();
        }

        $timezone = $task->timezone ?? $this->defaultTimezone;
        if ($timezone !== null && $timezone !== '') {
            $event = $event->timezone($timezone);
        }

        foreach ($task->gates as $gateClass) {
            $container = $this->container;
            $event = $event->when(static function () use ($container, $gateClass): bool {
                /** @var ScheduleGate $gate */
                $gate = $container->make($gateClass);

                return $gate();
            });
        }

        if ($task->name !== null && $task->name !== '') {
            $event = $event->name($task->name);
        }

        return $event;
    }

    /**
     * Write the task list to disk as a plain PHP array suitable
     * for `require`. Silently no-ops on failure — the scheduler
     * remains fully functional without the cache.
     *
     * @param  list<ScheduledTask>  $tasks
     */
    private function writeCache(string $path, array $tasks): void
    {
        $rows = array_map(static fn (ScheduledTask $t): array => $t->toArray(), $tasks);

        $contents = "<?php\n\nreturn " . \var_export($rows, true) . ";\n";

        $directory = \dirname($path);
        if (! \is_dir($directory) && ! @\mkdir($directory, 0755, true) && ! \is_dir($directory)) {
            return;
        }

        @\file_put_contents($path, $contents, LOCK_EX);
    }
}
