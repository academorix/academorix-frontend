<?php

declare(strict_types=1);

namespace Academorix\Application\Contracts\Data;

use Academorix\Application\Models\Application;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `applications` table.
 *
 * Global cross-tenant product registry — one row per Academorix
 * deployment (production, EU-production, staging, dev-preview, demo).
 * Every Tenant belongs to exactly one Application. One of the eight
 * rows that carry `application_id` directly (per `.kiro/steering/
 * tenancy-columns.md` §2).
 *
 * `#[Bind]` wires the container to resolve this interface to the
 * concrete {@see Application} model — consumed by `#[UseModel]` on
 * every repository per `.kiro/steering/php-attributes.md`.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[Bind(Application::class)]
interface ApplicationInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'applications';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key column type — string, prefixed ULID (`app_<26 chars>`).
     */
    public const string KEY_TYPE = 'string';

    /**
     * Prefix for the {@see \Academorix\Database\Concerns\HasPrefixedUlid}
     * trait — the trait joins `<ID_PREFIX>_<ulid>` to produce the
     * primary key (e.g. `app_01HZQK8YXBR3MDMP6QT9NR8N4F`).
     */
    public const string ID_PREFIX = 'app';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                    = 'id';
    public const string ATTR_SLUG                  = 'slug';
    public const string ATTR_NAME                  = 'name';
    public const string ATTR_DESCRIPTION           = 'description';
    public const string ATTR_DEFAULT_BUSINESS_TYPE = 'default_business_type';
    public const string ATTR_DEFAULT_LOCALE        = 'default_locale';
    public const string ATTR_DEFAULT_TIMEZONE      = 'default_timezone';
    public const string ATTR_DEFAULT_CURRENCY      = 'default_currency';
    public const string ATTR_CENTRAL_HOST          = 'central_host';
    public const string ATTR_PLATFORM_ADMIN_HOST   = 'platform_admin_host';
    public const string ATTR_CONFIG                = 'config';
    public const string ATTR_METADATA              = 'metadata';
    public const string ATTR_IS_DEFAULT            = 'is_default';
    public const string ATTR_IS_SYSTEM             = 'is_system';
    public const string ATTR_CREATED_BY            = 'created_by';
    public const string ATTR_UPDATED_BY            = 'updated_by';
    public const string ATTR_DELETED_BY            = 'deleted_by';
    public const string ATTR_CREATED_AT            = 'created_at';
    public const string ATTR_UPDATED_AT            = 'updated_at';
    public const string ATTR_DELETED_AT            = 'deleted_at';
}
