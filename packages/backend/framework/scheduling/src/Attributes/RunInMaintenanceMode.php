<?php

/**
 * @file packages/scheduling/src/Attributes/RunInMaintenanceMode.php
 *
 * @description
 * Class-level marker attribute. When present, the registrar wraps
 * the schedule with Laravel's `->evenInMaintenanceMode()` — the
 * task keeps ticking while the application is under
 * `php artisan down`.
 *
 * ## When to use
 *
 *   - Health-check probes that must keep answering even during a
 *     maintenance window.
 *   - Alerting / heartbeat pings that would otherwise silently
 *     stop and mask the outage.
 *
 * Not repeatable — either you want maintenance-mode bypass or you
 * don't.
 */

declare(strict_types=1);

namespace Stackra\Scheduling\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final class RunInMaintenanceMode
{
}
