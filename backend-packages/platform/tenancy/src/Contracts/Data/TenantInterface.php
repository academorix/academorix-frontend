<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Contracts\Data;

use Academorix\Tenancy\Models\Tenant;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `tenants` table.
 *
 * Customer of an Academorix Application — one of the eight rows
 * that carry `application_id` directly (per `.kiro/steering/
 * tenancy-columns.md` §2). Every domain row below the tenancy
 * boundary FKs into this table via `BelongsToTenant`.
 *
 * `#[Bind]` wires the container to resolve this interface to the
 * concrete {@see Tenant} model — consumed by `#[UseModel]` on
 * every repository per `.kiro/steering/php-attributes.md`.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Bind(Tenant::class)]
interface TenantInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'tenants';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key column type — string, prefixed ULID (`ten_<26 chars>`).
     */
    public const string KEY_TYPE = 'string';

    /**
     * Prefix for the {@see \Academorix\Database\Concerns\HasPrefixedUlid}
     * trait — the trait joins `<ID_PREFIX>_<ulid>` to produce the
     * primary key (e.g. `ten_01HZQK8YXBR3MDMP6QT9NR8N4F`).
     */
    public const string ID_PREFIX = 'ten';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                    = 'id';
    public const string ATTR_APPLICATION_ID        = 'application_id';
    public const string ATTR_SLUG                  = 'slug';
    public const string ATTR_NAME                  = 'name';
    public const string ATTR_LEGAL_NAME            = 'legal_name';
    public const string ATTR_STATUS                = 'status';
    public const string ATTR_BUSINESS_TYPE         = 'business_type';
    public const string ATTR_LOCALE                = 'locale';
    public const string ATTR_TIMEZONE              = 'timezone';
    public const string ATTR_CURRENCY              = 'currency';
    public const string ATTR_COUNTRY_CODE          = 'country_code';
    public const string ATTR_TAX_ID                = 'tax_id';
    public const string ATTR_PRIMARY_BRANDING_ID   = 'primary_branding_id';
    public const string ATTR_BRANDING              = 'branding';
    public const string ATTR_SETTINGS              = 'settings';
    public const string ATTR_FEATURES              = 'features';
    public const string ATTR_TERMINOLOGY           = 'terminology';
    public const string ATTR_TRIAL_ENDS_AT         = 'trial_ends_at';
    public const string ATTR_SUSPENDED_AT          = 'suspended_at';
    public const string ATTR_SUSPENSION_REASON     = 'suspension_reason';
    public const string ATTR_GRACE_ENDS_AT         = 'grace_ends_at';
    public const string ATTR_ARCHIVED_AT           = 'archived_at';
    public const string ATTR_METADATA              = 'metadata';
    public const string ATTR_IS_SYSTEM             = 'is_system';
    public const string ATTR_CREATED_BY            = 'created_by';
    public const string ATTR_UPDATED_BY            = 'updated_by';
    public const string ATTR_DELETED_BY            = 'deleted_by';
    public const string ATTR_CREATED_AT            = 'created_at';
    public const string ATTR_UPDATED_AT            = 'updated_at';
    public const string ATTR_DELETED_AT            = 'deleted_at';
}
