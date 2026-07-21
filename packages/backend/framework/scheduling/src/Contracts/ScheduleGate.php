<?php

/**
 * @file packages/scheduling/src/Contracts/ScheduleGate.php
 *
 * @description
 * Contract implemented by classes referenced from
 * {@see \Stackra\Scheduling\Attributes\ScheduleWhen}. The
 * scheduler evaluates the gate on every tick — the task runs
 * only when `__invoke()` returns `true`.
 *
 * ## Design notes
 *
 *   - The gate is a plain invokable — no arguments, single bool
 *     return. Everything the gate needs comes in via constructor
 *     injection resolved from the container.
 *   - Because the scheduler runs from CLI, gates MUST NOT depend
 *     on per-request services (auth, session, request state). Use
 *     config, cache, and repositories instead.
 *   - Gates should be side-effect-free. The scheduler may call
 *     the same gate more than once per tick (once to decide
 *     whether to run, once for logging); side effects would
 *     duplicate.
 */

declare(strict_types=1);

namespace Stackra\Scheduling\Contracts;

interface ScheduleGate
{
    /**
     * Decide whether the associated schedule may run on this tick.
     *
     * @return bool `true` — task runs; `false` — task is skipped for this tick.
     */
    public function __invoke(): bool;
}
