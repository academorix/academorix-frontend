<?php

/**
 * @file packages/scheduling/src/Attributes/RunInBackground.php
 *
 * @description
 * Class-level marker attribute. When present, the registrar wraps
 * the schedule with Laravel's `->runInBackground()` — the task is
 * launched in a subprocess so the scheduler tick does not block
 * on its completion.
 *
 * ## When to use
 *
 *   - Long-running tasks that would otherwise delay other
 *     scheduled tasks queued on the same tick.
 *   - Reports / exports / batch jobs where end-to-end latency is
 *     not the driving concern.
 *
 * Not repeatable — either you want non-blocking execution or you
 * don't.
 */

declare(strict_types=1);

namespace Stackra\Scheduling\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final class RunInBackground
{
}
