<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Contracts\Data;

use Academorix\Geofencing\Models\GeofenceCheck;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `geofence_checks` table.
 *
 * Immutable evaluation audit log. Two polymorphic pairs on every row:
 *
 *   - `subject_type` / `subject_id`   — WHY the check ran (caller entity).
 *   - `fenceable_type` / `fenceable_id` — WHAT the check ran AGAINST.
 *
 * Rows are insert-only in application code — the model's `saving` hook
 * throws on any update. Overrides are modelled as NEW rows with
 * `supersedes_check_id` pointing at the original.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Bind(GeofenceCheck::class)]
interface GeofenceCheckInterface
{
    public const string TABLE = 'geofence_checks';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'gfc';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                    = 'id';
    public const string ATTR_TENANT_ID             = 'tenant_id';
    public const string ATTR_FENCEABLE_TYPE        = 'fenceable_type';
    public const string ATTR_FENCEABLE_ID          = 'fenceable_id';
    public const string ATTR_SUBJECT_TYPE          = 'subject_type';
    public const string ATTR_SUBJECT_ID            = 'subject_id';
    public const string ATTR_RESULT                = 'result';
    public const string ATTR_MODE                  = 'mode';
    public const string ATTR_CAPTURED_LOCATION     = 'captured_location';
    public const string ATTR_ACCURACY_M            = 'accuracy_m';
    public const string ATTR_DISTANCE_TO_FENCE_M   = 'distance_to_fence_m';
    public const string ATTR_EVALUATED_AT          = 'evaluated_at';
    public const string ATTR_SUPERSEDES_CHECK_ID   = 'supersedes_check_id';
    public const string ATTR_OVERRIDE_TASK_ID      = 'override_task_id';
    public const string ATTR_OVERRIDDEN_BY_USER_ID = 'overridden_by_user_id';
    public const string ATTR_OVERRIDE_REASON       = 'override_reason';
    public const string ATTR_METADATA              = 'metadata';
    public const string ATTR_CREATED_BY            = 'created_by';
    public const string ATTR_UPDATED_BY            = 'updated_by';
    public const string ATTR_DELETED_BY            = 'deleted_by';
    public const string ATTR_CREATED_AT            = 'created_at';
    public const string ATTR_UPDATED_AT            = 'updated_at';
    public const string ATTR_DELETED_AT            = 'deleted_at';
}
