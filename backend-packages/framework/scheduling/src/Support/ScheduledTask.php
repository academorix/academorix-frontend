<?php

/**
 * @file packages/scheduling/src/Support/ScheduledTask.php
 *
 * @description
 * Immutable value object describing one registered schedule.
 * Produced by {@see ScheduleDiscovery}; consumed by
 * {@see ScheduleRegistrar}. Also the on-disk shape used when the
 * discovery result is cached to
 * `bootstrap/cache/scheduling.php`.
 *
 * ## Cadence source
 *
 * Exactly one of `$frequency` / `$cronExpression` must be
 * non-`null`. The discovery layer enforces the invariant — if a
 * class carries BOTH {@see \Academorix\Scheduling\Attributes\Schedule}
 * and {@see \Academorix\Scheduling\Attributes\Cron} the task is
 * rejected before it reaches the registrar.
 *
 * ## Persistence shape
 *
 * The `toArray()` / `fromArray()` pair round-trips every field so
 * the cached file is a plain `require`-able PHP array. Enum
 * values collapse to their scalar `->value` so `var_export()`
 * gives us a clean, human-readable cache dump.
 */

declare(strict_types=1);

namespace Academorix\Scheduling\Support;

use Academorix\Scheduling\Enums\Frequency;

final readonly class ScheduledTask
{
    /**
     * @param  class-string  $className          Fully-qualified class carrying the schedule attributes.
     * @param  bool          $isCommand          `true` — register via `Schedule::command()`; `false` — via `Schedule::job()`.
     * @param  Frequency|null $frequency         Named cadence, or `null` when the task uses a raw cron expression.
     * @param  string|null   $cronExpression     Raw cron expression, or `null` when the task uses a named frequency.
     * @param  bool          $withoutOverlapping Whether to apply `->withoutOverlapping()`.
     * @param  int|null      $overlapTtlMinutes  Optional TTL in minutes for the overlap lock.
     * @param  bool          $onOneServer        Whether to apply `->onOneServer()`.
     * @param  bool          $runInBackground    Whether to apply `->runInBackground()`.
     * @param  list<string>  $environments       Environment whitelist for `->environments([...])`. Empty means "all envs".
     * @param  bool          $runInMaintenanceMode Whether to apply `->evenInMaintenanceMode()`.
     * @param  string|null   $timezone           Per-task timezone override, or `null` to leave the default in place.
     * @param  list<class-string> $gates         Gate classes for `->when(...)`. Every gate must return `true`.
     * @param  string|null   $name               Explicit task name for `->name(...)`, or `null` to let Laravel derive one.
     */
    public function __construct(
        public string $className,
        public bool $isCommand,
        public ?Frequency $frequency,
        public ?string $cronExpression,
        public bool $withoutOverlapping,
        public ?int $overlapTtlMinutes,
        public bool $onOneServer,
        public bool $runInBackground,
        public array $environments,
        public bool $runInMaintenanceMode,
        public ?string $timezone,
        public array $gates,
        public ?string $name,
    ) {}

    /**
     * Serialise to a plain PHP array. Used for the cached
     * `bootstrap/cache/scheduling.php` dump.
     *
     * @return array{
     *   className: class-string,
     *   isCommand: bool,
     *   frequency: string|null,
     *   cronExpression: string|null,
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
    public function toArray(): array
    {
        return [
            'className' => $this->className,
            'isCommand' => $this->isCommand,
            'frequency' => $this->frequency?->value,
            'cronExpression' => $this->cronExpression,
            'withoutOverlapping' => $this->withoutOverlapping,
            'overlapTtlMinutes' => $this->overlapTtlMinutes,
            'onOneServer' => $this->onOneServer,
            'runInBackground' => $this->runInBackground,
            'environments' => $this->environments,
            'runInMaintenanceMode' => $this->runInMaintenanceMode,
            'timezone' => $this->timezone,
            'gates' => $this->gates,
            'name' => $this->name,
        ];
    }

    /**
     * Rehydrate a task from the cached array representation.
     * Silently coerces enum-backed fields to their case; unknown
     * frequency values collapse to `null` so the task falls
     * through to the cron path.
     *
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        /** @var class-string $className */
        $className = (string) ($data['className'] ?? '');

        /** @var string|null $frequencyValue */
        $frequencyValue = $data['frequency'] ?? null;
        $frequency = \is_string($frequencyValue) ? Frequency::tryFrom($frequencyValue) : null;

        /** @var list<string> $environments */
        $environments = \is_array($data['environments'] ?? null) ? array_values(array_filter(
            $data['environments'],
            static fn ($v): bool => \is_string($v),
        )) : [];

        /** @var list<class-string> $gates */
        $gates = \is_array($data['gates'] ?? null) ? array_values(array_filter(
            $data['gates'],
            static fn ($v): bool => \is_string($v) && $v !== '',
        )) : [];

        return new self(
            className: $className,
            isCommand: (bool) ($data['isCommand'] ?? false),
            frequency: $frequency,
            cronExpression: isset($data['cronExpression']) && \is_string($data['cronExpression'])
                ? $data['cronExpression']
                : null,
            withoutOverlapping: (bool) ($data['withoutOverlapping'] ?? false),
            overlapTtlMinutes: isset($data['overlapTtlMinutes']) && \is_int($data['overlapTtlMinutes'])
                ? $data['overlapTtlMinutes']
                : null,
            onOneServer: (bool) ($data['onOneServer'] ?? false),
            runInBackground: (bool) ($data['runInBackground'] ?? false),
            environments: $environments,
            runInMaintenanceMode: (bool) ($data['runInMaintenanceMode'] ?? false),
            timezone: isset($data['timezone']) && \is_string($data['timezone'])
                ? $data['timezone']
                : null,
            gates: $gates,
            name: isset($data['name']) && \is_string($data['name'])
                ? $data['name']
                : null,
        );
    }
}
