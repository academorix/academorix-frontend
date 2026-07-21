<?php

/**
 * @file packages/scheduling/src/Support/ScheduleDiscovery.php
 *
 * @description
 * Walks the `olvlvl/composer-attribute-collector` manifest for
 * every class carrying at least one
 * {@see \Stackra\Scheduling\Attributes\Schedule} or
 * {@see \Stackra\Scheduling\Attributes\Cron} attribute, and
 * turns each into an immutable {@see ScheduledTask} value object.
 *
 * ## What discovery does
 *
 *   1. Reads the pre-built attribute manifest — no filesystem
 *      walk, no reflection cost per request. The manifest is
 *      produced at `composer dump-autoload` time by the
 *      collector plugin.
 *   2. Collates repeatable attributes per class so a single Job
 *      with two `#[Schedule]` calls emits two {@see ScheduledTask}
 *      entries.
 *   3. Rejects classes carrying both `#[Schedule]` and `#[Cron]`
 *      — the task is dropped and a hint is left in the returned
 *      collection's shape (the class simply doesn't appear).
 *   4. Resolves modifier attributes (`WithoutOverlapping`,
 *      `OnOneServer`, ...) once per class and attaches the
 *      resulting flags to every {@see ScheduledTask} produced for
 *      that class.
 *
 * ## Octane-safety
 *
 * The discovery layer holds no mutable state beyond its
 * constructor arguments. Every `discover()` call re-reads the
 * manifest, so a hot-reload during development picks up
 * newly-attributed jobs on the next scheduler tick without a
 * worker restart. In production the cache layer sits above this
 * so the manifest is only walked once per boot.
 * ## Design notes
 *
 *   - The class is NOT `final` so tests can subclass it and
 *     override {@see self::discover()} with a canned list. In
 *     production every call path goes through the composer
 *     manifest — subclasses stay out of the wire.
 */

declare(strict_types=1);

namespace Stackra\Scheduling\Support;

use Stackra\Scheduling\Attributes\Cron;
use Stackra\Scheduling\Attributes\Environments;
use Stackra\Scheduling\Attributes\OnOneServer;
use Stackra\Scheduling\Attributes\RunInBackground;
use Stackra\Scheduling\Attributes\RunInMaintenanceMode;
use Stackra\Scheduling\Attributes\Schedule;
use Stackra\Scheduling\Attributes\ScheduleName;
use Stackra\Scheduling\Attributes\ScheduleWhen;
use Stackra\Scheduling\Attributes\Timezone;
use Stackra\Scheduling\Attributes\WithoutOverlapping;
use Illuminate\Console\Command;
use Illuminate\Container\Attributes\Singleton;
use olvlvl\ComposerAttributeCollector\Attributes;
use ReflectionClass;
use Throwable;

/**
 * Manifest reader.
 *
 * Bound as `#[Singleton]` per ADR 0006 — the discovery pass is
 * pure over its input (`vendor/attributes.php` produced by
 * composer-attribute-collector) so sharing one instance across
 * the worker's lifetime is safe.
 */
#[Singleton]
class ScheduleDiscovery
{
    /**
     * Walk the attribute manifest and return every discovered task.
     * Order is not guaranteed — the registrar should not rely on
     * it.
     *
     * @return list<ScheduledTask>
     */
    public function discover(): array
    {
        if (! class_exists(Attributes::class)) {
            // Manifest not built (composer install skipped the
            // attribute-collector plugin). Return empty rather
            // than crash so the boot sequence stays green in
            // pristine CI images.
            return [];
        }

        $classes = $this->collectAttributedClasses();

        $tasks = [];
        foreach ($classes as $className) {
            foreach ($this->buildTasksForClass($className) as $task) {
                $tasks[] = $task;
            }
        }

        return $tasks;
    }

    /**
     * Read the manifest and return every class carrying at least
     * one `#[Schedule]` OR one `#[Cron]` attribute. Deduplicated
     * so a class carrying both attributes appears once.
     *
     * @return list<class-string>
     */
    private function collectAttributedClasses(): array
    {
        /** @var array<class-string, true> $set */
        $set = [];

        foreach (Attributes::findTargetClasses(Schedule::class) as $target) {
            /** @var class-string $name */
            $name = $target->name;
            $set[$name] = true;
        }

        foreach (Attributes::findTargetClasses(Cron::class) as $target) {
            /** @var class-string $name */
            $name = $target->name;
            $set[$name] = true;
        }

        return array_keys($set);
    }

    /**
     * Read every attribute the class carries and emit one
     * {@see ScheduledTask} per cadence source. Skips classes with
     * conflicting cadence sources (both `#[Schedule]` and `#[Cron]`).
     *
     * @param  class-string  $className
     * @return list<ScheduledTask>
     */
    private function buildTasksForClass(string $className): array
    {
        if (! class_exists($className)) {
            return [];
        }

        try {
            $reflection = new ReflectionClass($className);
        } catch (Throwable) {
            return [];
        }

        $schedules = $this->attributesOf($reflection, Schedule::class);
        $crons = $this->attributesOf($reflection, Cron::class);

        // Cadence source is exclusive — pick one attribute family
        // per class or the task is silently dropped.
        if ($schedules !== [] && $crons !== []) {
            return [];
        }

        if ($schedules === [] && $crons === []) {
            return [];
        }

        $isCommand = $reflection->isSubclassOf(Command::class);
        $modifiers = $this->collectModifiers($reflection);

        $tasks = [];

        foreach ($schedules as $schedule) {
            $tasks[] = new ScheduledTask(
                className: $className,
                isCommand: $isCommand,
                frequency: $schedule->frequency,
                cronExpression: null,
                withoutOverlapping: $modifiers['withoutOverlapping'],
                overlapTtlMinutes: $modifiers['overlapTtlMinutes'],
                onOneServer: $modifiers['onOneServer'],
                runInBackground: $modifiers['runInBackground'],
                environments: $modifiers['environments'],
                runInMaintenanceMode: $modifiers['runInMaintenanceMode'],
                timezone: $modifiers['timezone'],
                gates: $modifiers['gates'],
                name: $modifiers['name'],
            );
        }

        foreach ($crons as $cron) {
            $tasks[] = new ScheduledTask(
                className: $className,
                isCommand: $isCommand,
                frequency: null,
                cronExpression: $cron->expression,
                withoutOverlapping: $modifiers['withoutOverlapping'],
                overlapTtlMinutes: $modifiers['overlapTtlMinutes'],
                onOneServer: $modifiers['onOneServer'],
                runInBackground: $modifiers['runInBackground'],
                environments: $modifiers['environments'],
                runInMaintenanceMode: $modifiers['runInMaintenanceMode'],
                timezone: $modifiers['timezone'],
                gates: $modifiers['gates'],
                name: $modifiers['name'],
            );
        }

        return $tasks;
    }

    /**
     * Fetch every attribute instance of the given class off a
     * reflection target. Repeatable attributes come through in
     * declaration order.
     *
     * @template T of object
     *
     * @param  ReflectionClass<object>  $reflection
     * @param  class-string<T>  $attribute
     * @return list<T>
     */
    private function attributesOf(ReflectionClass $reflection, string $attribute): array
    {
        $instances = [];

        foreach ($reflection->getAttributes($attribute) as $ref) {
            /** @var T $instance */
            $instance = $ref->newInstance();
            $instances[] = $instance;
        }

        return $instances;
    }

    /**
     * Read every modifier attribute the class carries and collapse
     * them into a single associative payload. Missing attributes
     * fall back to sensible defaults.
     *
     * @param  ReflectionClass<object>  $reflection
     * @return array{
     *   withoutOverlapping: bool,
     *   overlapTtlMinutes: int|null,
     *   onOneServer: bool,
     *   runInBackground: bool,
     *   environments: list<string>,
     *   runInMaintenanceMode: bool,
     *   timezone: string|null,
     *   gates: list<class-string>,
     *   name: string|null,
     * }
     */
    private function collectModifiers(ReflectionClass $reflection): array
    {
        $overlap = $this->attributesOf($reflection, WithoutOverlapping::class);
        $oneServer = $this->attributesOf($reflection, OnOneServer::class);
        $background = $this->attributesOf($reflection, RunInBackground::class);
        $envs = $this->attributesOf($reflection, Environments::class);
        $maintenance = $this->attributesOf($reflection, RunInMaintenanceMode::class);
        $timezone = $this->attributesOf($reflection, Timezone::class);
        $gates = $this->attributesOf($reflection, ScheduleWhen::class);
        $name = $this->attributesOf($reflection, ScheduleName::class);

        return [
            'withoutOverlapping' => $overlap !== [],
            'overlapTtlMinutes' => $overlap !== [] ? $overlap[0]->ttlMinutes : null,
            'onOneServer' => $oneServer !== [],
            'runInBackground' => $background !== [],
            'environments' => $envs !== [] ? $envs[0]->environments : [],
            'runInMaintenanceMode' => $maintenance !== [],
            'timezone' => $timezone !== [] ? $timezone[0]->timezone : null,
            'gates' => array_values(array_map(
                static fn (ScheduleWhen $g): string => $g->gate,
                $gates,
            )),
            'name' => $name !== [] ? $name[0]->name : null,
        ];
    }
}
