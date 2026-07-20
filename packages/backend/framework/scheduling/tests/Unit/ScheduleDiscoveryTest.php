<?php

/**
 * @file packages/scheduling/tests/Unit/ScheduleDiscoveryTest.php
 *
 * @description
 * Exercises the collation logic in
 * {@see \Academorix\Scheduling\Support\ScheduleDiscovery}. The
 * discovery layer's own manifest read is provided by
 * `olvlvl/composer-attribute-collector`, which we treat as an
 * external dependency — instead of stubbing the manifest, this
 * suite drives the `buildTasksForClass` / `collectModifiers`
 * pipeline directly via reflection so every branch is covered
 * without booting the composer plugin.
 *
 * ## What each test locks in
 *
 *   - **Cadence exclusivity** — a class carrying both `#[Schedule]`
 *     and `#[Cron]` is dropped silently. This is the invariant the
 *     registrar relies on so `applyCadence()` never sees a task
 *     with both sources.
 *   - **Repeatable expansion** — `n` `#[Schedule]` attributes on
 *     the same class emit `n` tasks with modifiers replicated.
 *   - **Modifier collation** — `#[WithoutOverlapping(5)]` sets
 *     both flag + TTL; missing attributes fall back to sensible
 *     defaults.
 *   - **Command vs Job detection** — classes extending Laravel's
 *     `Command` are flagged so the registrar routes them to
 *     `Schedule::command()`.
 */

declare(strict_types=1);

use Academorix\Scheduling\Attributes\Cron;
use Academorix\Scheduling\Attributes\Environments;
use Academorix\Scheduling\Attributes\OnOneServer;
use Academorix\Scheduling\Attributes\RunInBackground;
use Academorix\Scheduling\Attributes\RunInMaintenanceMode;
use Academorix\Scheduling\Attributes\Schedule;
use Academorix\Scheduling\Attributes\ScheduleName;
use Academorix\Scheduling\Attributes\ScheduleWhen;
use Academorix\Scheduling\Attributes\Timezone;
use Academorix\Scheduling\Attributes\WithoutOverlapping;
use Academorix\Scheduling\Contracts\ScheduleGate;
use Academorix\Scheduling\Enums\Frequency;
use Academorix\Scheduling\Support\ScheduleDiscovery;
use Academorix\Scheduling\Support\ScheduledTask;
use Illuminate\Console\Command;

// -----------------------------------------------------------------
// Fixtures — attribute-carrying classes we exercise below.
// -----------------------------------------------------------------

#[Schedule(Frequency::Daily)]
final class DiscoveryTest_DailyJob {}

#[Schedule(Frequency::Hourly)]
#[Schedule(Frequency::Daily)]
#[WithoutOverlapping(ttlMinutes: 5)]
#[OnOneServer]
#[RunInBackground]
#[Environments('production', 'staging')]
#[RunInMaintenanceMode]
#[Timezone('Africa/Casablanca')]
#[ScheduleName('multi-cadence-job')]
final class DiscoveryTest_MultiJob {}

#[Cron('*/15 9-17 * * 1-5')]
final class DiscoveryTest_CronJob {}

#[Schedule(Frequency::Daily)]
#[Cron('0 3 * * *')]
final class DiscoveryTest_ConflictingJob {}

#[Schedule(Frequency::EveryFifteenMinutes)]
#[ScheduleWhen(DiscoveryTest_GateA::class)]
#[ScheduleWhen(DiscoveryTest_GateB::class)]
final class DiscoveryTest_GatedJob {}

final class DiscoveryTest_GateA implements ScheduleGate
{
    public function __invoke(): bool
    {
        return true;
    }
}

final class DiscoveryTest_GateB implements ScheduleGate
{
    public function __invoke(): bool
    {
        return true;
    }
}

#[Schedule(Frequency::Hourly)]
final class DiscoveryTest_HourlyCommand extends Command
{
    protected $signature = 'discovery-test:hourly';
}

/**
 * The discovery API is package-private for `buildTasksForClass`
 * — we invoke it via reflection so the tests exercise the exact
 * production code path without depending on the composer
 * manifest being populated.
 *
 * @return list<ScheduledTask>
 */
function discoveryTest_buildTasks(string $className): array
{
    $discovery = new ScheduleDiscovery;
    $reflection = new ReflectionMethod(ScheduleDiscovery::class, 'buildTasksForClass');
    $reflection->setAccessible(true);

    /** @var list<ScheduledTask> $tasks */
    $tasks = $reflection->invoke($discovery, $className);

    return $tasks;
}

// -----------------------------------------------------------------
// Group 1 — one Schedule attribute produces one task
// -----------------------------------------------------------------

it('produces one task for a single #[Schedule] attribute', function (): void {
    // The simplest happy-path shape — one attribute, one task,
    // every modifier flag defaulted.
    $tasks = discoveryTest_buildTasks(DiscoveryTest_DailyJob::class);

    expect($tasks)->toHaveCount(1);

    $task = $tasks[0];
    expect($task->className)->toBe(DiscoveryTest_DailyJob::class)
        ->and($task->isCommand)->toBeFalse()
        ->and($task->frequency)->toBe(Frequency::Daily)
        ->and($task->cronExpression)->toBeNull()
        ->and($task->withoutOverlapping)->toBeFalse()
        ->and($task->overlapTtlMinutes)->toBeNull()
        ->and($task->onOneServer)->toBeFalse()
        ->and($task->runInBackground)->toBeFalse()
        ->and($task->environments)->toBe([])
        ->and($task->runInMaintenanceMode)->toBeFalse()
        ->and($task->timezone)->toBeNull()
        ->and($task->gates)->toBe([])
        ->and($task->name)->toBeNull();
});

// -----------------------------------------------------------------
// Group 2 — repeatable Schedule attributes fan out into N tasks
// -----------------------------------------------------------------

it('emits one task per #[Schedule] with modifiers replicated across every task', function (): void {
    // Two `#[Schedule]` calls plus the full modifier stack —
    // both emitted tasks should carry an identical modifier
    // payload so the registrar applies the same guards to each
    // cadence.
    $tasks = discoveryTest_buildTasks(DiscoveryTest_MultiJob::class);

    expect($tasks)->toHaveCount(2);

    // Sort by cadence for a deterministic assertion order — the
    // discovery layer does not guarantee ordering.
    usort($tasks, static fn (ScheduledTask $a, ScheduledTask $b): int => strcmp(
        $a->frequency?->value ?? '',
        $b->frequency?->value ?? '',
    ));

    // Daily first (alphabetical), then Hourly.
    expect($tasks[0]->frequency)->toBe(Frequency::Daily)
        ->and($tasks[1]->frequency)->toBe(Frequency::Hourly);

    foreach ($tasks as $task) {
        expect($task->withoutOverlapping)->toBeTrue()
            ->and($task->overlapTtlMinutes)->toBe(5)
            ->and($task->onOneServer)->toBeTrue()
            ->and($task->runInBackground)->toBeTrue()
            ->and($task->environments)->toBe(['production', 'staging'])
            ->and($task->runInMaintenanceMode)->toBeTrue()
            ->and($task->timezone)->toBe('Africa/Casablanca')
            ->and($task->name)->toBe('multi-cadence-job');
    }
});

// -----------------------------------------------------------------
// Group 3 — cron-only classes produce a single task
// -----------------------------------------------------------------

it('produces one task for a single #[Cron] attribute', function (): void {
    // Cron-only shape — `frequency` is null, `cronExpression`
    // carries the raw string.
    $tasks = discoveryTest_buildTasks(DiscoveryTest_CronJob::class);

    expect($tasks)->toHaveCount(1)
        ->and($tasks[0]->frequency)->toBeNull()
        ->and($tasks[0]->cronExpression)->toBe('*/15 9-17 * * 1-5');
});

// -----------------------------------------------------------------
// Group 4 — cadence exclusivity is enforced
// -----------------------------------------------------------------

it('drops a class carrying both #[Schedule] and #[Cron]', function (): void {
    // The registrar's `applyCadence()` picks whichever source
    // is non-null. Allowing both would let a class register
    // TWO tasks per attribute-source, doubling the workload and
    // hiding the misconfiguration. Drop it instead so a
    // reviewer notices the missing schedule.
    $tasks = discoveryTest_buildTasks(DiscoveryTest_ConflictingJob::class);

    expect($tasks)->toBe([]);
});

// -----------------------------------------------------------------
// Group 5 — gate discovery preserves declaration order
// -----------------------------------------------------------------

it('collects every #[ScheduleWhen] gate on the class', function (): void {
    // The registrar wraps each gate in an `->when(...)` call,
    // which AND-composes them. The discovery layer must expose
    // every gate — dropping one silently would flip a
    // conjunction into a weaker filter.
    $tasks = discoveryTest_buildTasks(DiscoveryTest_GatedJob::class);

    expect($tasks)->toHaveCount(1)
        ->and($tasks[0]->gates)->toBe([
            DiscoveryTest_GateA::class,
            DiscoveryTest_GateB::class,
        ]);
});

// -----------------------------------------------------------------
// Group 6 — Command detection routes to Schedule::command()
// -----------------------------------------------------------------

it('flags Command subclasses so the registrar picks Schedule::command()', function (): void {
    // Reflection check inside the discovery layer — subclass of
    // `Illuminate\Console\Command` sets `isCommand = true`.
    $tasks = discoveryTest_buildTasks(DiscoveryTest_HourlyCommand::class);

    expect($tasks)->toHaveCount(1)
        ->and($tasks[0]->isCommand)->toBeTrue();
});

// -----------------------------------------------------------------
// Group 7 — round-trip through the persistence array shape
// -----------------------------------------------------------------

it('round-trips through ScheduledTask::toArray()/fromArray()', function (): void {
    // The cache format is `require`-able PHP. Every field must
    // survive a trip through `toArray()` and `fromArray()` so
    // the cached scheduler matches an uncached scheduler.
    $tasks = discoveryTest_buildTasks(DiscoveryTest_MultiJob::class);

    foreach ($tasks as $original) {
        $rehydrated = ScheduledTask::fromArray($original->toArray());

        expect($rehydrated)->toEqual($original);
    }
});
