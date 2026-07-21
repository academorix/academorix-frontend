<?php

declare(strict_types=1);

namespace Stackra\Application\Contracts\Data;

use Stackra\Application\Models\BusinessType;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `business_types` table.
 *
 * Dual-source catalogue per `.kiro/steering/enum-db-seed-dual-source.md`:
 * `BusinessTypeEnum` is code-primary (compile-time branching); this
 * table is the admin-visible mirror. Rows with `tenant_id = null`
 * are platform-seeded (`is_system = true`); rows with `tenant_id` set
 * are tenant-defined customs (`is_system = false`, resolved as
 * `BusinessTypeEnum::Custom` in code).
 *
 * `#[Bind]` wires the container to resolve this interface to the
 * concrete {@see BusinessType} model — consumed by `#[UseModel]` on
 * every repository per `.kiro/steering/php-attributes.md`.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[Bind(BusinessType::class)]
interface BusinessTypeInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'business_types';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key column type — string, prefixed ULID (`bst_<26 chars>`).
     */
    public const string KEY_TYPE = 'string';

    /**
     * Prefix for the {@see \Stackra\Database\Concerns\HasPrefixedUlid}
     * trait — the trait joins `<ID_PREFIX>_<ulid>` to produce the
     * primary key (e.g. `bst_01HZQK8YXBR3MDMP6QT9NR8N4F`).
     */
    public const string ID_PREFIX = 'bst';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID            = 'id';
    public const string ATTR_TENANT_ID     = 'tenant_id';
    public const string ATTR_SLUG          = 'slug';
    public const string ATTR_LABEL         = 'label';
    public const string ATTR_DESCRIPTION   = 'description';
    public const string ATTR_ICON          = 'icon';
    public const string ATTR_HERO_IMAGE_URL= 'hero_image_url';
    public const string ATTR_SORT_ORDER    = 'sort_order';
    public const string ATTR_IS_SYSTEM     = 'is_system';
    public const string ATTR_IS_VISIBLE    = 'is_visible';
    public const string ATTR_TRANSLATIONS  = 'translations';
    public const string ATTR_METADATA      = 'metadata';
    public const string ATTR_CREATED_BY    = 'created_by';
    public const string ATTR_UPDATED_BY    = 'updated_by';
    public const string ATTR_DELETED_BY    = 'deleted_by';
    public const string ATTR_CREATED_AT    = 'created_at';
    public const string ATTR_UPDATED_AT    = 'updated_at';
    public const string ATTR_DELETED_AT    = 'deleted_at';
}
