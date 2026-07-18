<?php

declare(strict_types=1);

/**
 * @file packages/foundation/src/Concerns/Lifecyclable.php
 *
 * @description
 * Reusable before/after lifecycle hooks for any class that runs a
 * single-shot operation with optional pre-work and post-work.
 *
 * Composed by seeders (via {@see \Academorix\Database\Concerns\Enumable}),
 * discovery bootstrappers, and any other primitive that benefits from
 * "run these hooks before/after the main body" without having to
 * hand-roll two abstract methods per consumer.
 *
 * Both hooks are non-abstract: the default is a no-op. Consumers
 * override only the phase they actually care about — no burden on
 * classes that don't need lifecycle at all.
 *
 * @category Concerns
 *
 * @since    0.1.0
 */

namespace Academorix\Foundation\Concerns;

/**
 * Before/after hook trait — override the phase you care about, ignore the rest.
 *
 * ## Usage
 *
 * ```php
 * use Academorix\Foundation\Concerns\Lifecyclable;
 *
 * final class SeedSomething extends Seeder
 * {
 *     use Lifecyclable;
 *
 *     public function run(): void
 *     {
 *         $this->before();
 *         // ... the actual work
 *         $this->after();
 *     }
 *
 *     protected function after(): void
 *     {
 *         // e.g. clear caches, dispatch an event
 *     }
 * }
 * ```
 *
 * @category Concerns
 *
 * @since    0.1.0
 */
trait Lifecyclable
{
    /**
     * Runs before the main body. Override in the consumer to hook
     * pre-work (validation, cache warming, log line, dispatch a
     * "starting" event). Default is a no-op so consumers that don't
     * need pre-work skip the override.
     */
    protected function before(): void
    {
    }

    /**
     * Runs after the main body. Override in the consumer to hook
     * post-work (cache invalidation, dispatch a "completed" event,
     * housekeeping). Default is a no-op.
     */
    protected function after(): void
    {
    }
}
