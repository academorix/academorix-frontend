<?php

/**
 * @file packages/scheduling/src/Attributes/Environments.php
 *
 * @description
 * Class-level attribute that restricts the schedule to a specific
 * set of environments via Laravel's `->environments([...])`. If
 * the current `app.env` is not in the whitelist, the tick is a
 * no-op for that task.
 *
 * ## Typical use
 *
 *   - Guard destructive maintenance jobs so they only run in
 *     `production` (never in staging preview branches).
 *   - Restrict noisy diagnostic jobs to `local` / `development`.
 *
 * Variadic constructor — pass one string per environment:
 *
 *     #[Environments('production', 'staging')]
 *
 * Not repeatable — one whitelist per class. Stack additional
 * environments on the single call site.
 */

declare(strict_types=1);

namespace Academorix\Scheduling\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final class Environments
{
    /**
     * Environments the schedule is allowed to run in. Immutable
     * once constructed.
     *
     * @var list<string>
     */
    public readonly array $environments;

    /**
     * @param  string  ...$envs  One entry per allowed environment (`'production'`, `'staging'`, ...).
     */
    public function __construct(string ...$envs)
    {
        $this->environments = array_values($envs);
    }
}
