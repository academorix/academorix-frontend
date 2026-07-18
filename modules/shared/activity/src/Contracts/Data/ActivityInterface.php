<?php

declare(strict_types=1);

namespace Academorix\Activity\Contracts\Data;

use Academorix\Activity\Models\Activity;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `activity_log` table.
 *
 * Extends `spatie/laravel-activitylog`'s schema. Every column below
 * comes from spatie's own migration EXCEPT `tenant_id`, which is
 * added by a companion migration in this package (per
 * `.kiro/steering/tenancy-columns.md` §3, gap #2).
 *
 * The primary key `id` is a prefixed ULID (`act_<26 chars>`) — this
 * package overrides spatie's default bigint identity via
 * `HasPrefixedUlid` on the model.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[Bind(Activity::class)]
interface ActivityInterface
{
    /**
     * Table name — kept as spatie's default so the two schemas stay
     * co-located. Overriding this requires re-running spatie's own
     * migrations against the new name.
     */
    public const string TABLE = 'activity_log';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `act_<ulid>`.
     */
    public const string ID_PREFIX = 'act';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID           = 'id';
    public const string ATTR_TENANT_ID    = 'tenant_id';
    public const string ATTR_LOG_NAME     = 'log_name';
    public const string ATTR_DESCRIPTION  = 'description';
    public const string ATTR_SUBJECT_TYPE = 'subject_type';
    public const string ATTR_SUBJECT_ID   = 'subject_id';
    public const string ATTR_CAUSER_TYPE  = 'causer_type';
    public const string ATTR_CAUSER_ID    = 'causer_id';
    public const string ATTR_PROPERTIES   = 'properties';
    public const string ATTR_BATCH_UUID   = 'batch_uuid';
    public const string ATTR_EVENT        = 'event';
    public const string ATTR_CREATED_AT   = 'created_at';
    public const string ATTR_UPDATED_AT   = 'updated_at';
}
