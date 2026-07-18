<?php

/**
 * @file packages/scheduling/src/Attributes/OnOneServer.php
 *
 * @description
 * Class-level marker attribute. When present, the registrar wraps
 * the schedule with Laravel's `->onOneServer()` — the scheduler
 * uses an atomic cache lock to guarantee only one server in a
 * horizontally-scaled cluster runs the task per tick.
 *
 * ## Requirements
 *
 *   - The `cache.default` driver must support atomic locks
 *     (Redis, Memcached, DynamoDB, database — the `file` and
 *     `array` drivers do NOT).
 *   - Every server MUST share the same clock (NTP-synced) and
 *     the same cache backend, otherwise the lock is not global.
 *
 * Not repeatable — either you want single-server semantics or
 * you don't.
 */

declare(strict_types=1);

namespace Academorix\Scheduling\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final class OnOneServer
{
}
