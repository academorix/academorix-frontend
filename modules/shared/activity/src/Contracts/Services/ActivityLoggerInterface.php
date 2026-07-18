<?php

declare(strict_types=1);

namespace Academorix\Activity\Contracts\Services;

use Academorix\Activity\Models\Activity;
use Academorix\Activity\Services\DefaultActivityLogger;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Database\Eloquent\Model;

/**
 * Facade over spatie's `activity()` helper for ad-hoc activity
 * logging outside the `HasActivityLog` observer path.
 *
 * Callers reach for this contract when they need to record an event
 * that isn't a model lifecycle transition (login attempts, background
 * job success, external webhook receipts). For model create / update
 * / delete flows, prefer composing `HasActivityLog` on the model —
 * that path is fully automatic.
 *
 * The default {@see DefaultActivityLogger} auto-fills `tenant_id`
 * from the resolved `TenantContext` and `causer` from the active
 * Sanctum guard. Consumer apps override via `#[Bind]` when they need
 * different resolution semantics.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[Bind(DefaultActivityLogger::class)]
interface ActivityLoggerInterface
{
    /**
     * Record one activity row.
     *
     * @param  string       $logName      Grouping bucket (e.g. `auth`, `billing`).
     * @param  string       $description  Human-readable summary — displayed in the feed UI.
     * @param  array<string, mixed>  $properties  Arbitrary payload merged into spatie's `properties` column.
     * @param  Model|null   $subject      What the event happened TO.
     * @param  Model|null   $causer       Who caused the event. Defaults to the resolved auth user.
     * @return Activity     The persisted row.
     */
    public function record(
        string $logName,
        string $description,
        array $properties = [],
        ?Model $subject = null,
        ?Model $causer = null,
    ): Activity;
}
