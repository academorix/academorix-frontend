<?php

declare(strict_types=1);

namespace Stackra\Compliance\Contracts\Data;

use Stackra\Compliance\Models\ConsentCategory;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `consent_categories` table.
 *
 * Platform-default rows carry `tenant_id=NULL` and are visible to
 * every tenant. Tenant overrides carry a tenant_id and shadow the
 * default. `is_system=true` marks rows that are immutable outside
 * the seed context.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(ConsentCategory::class)]
interface ConsentCategoryInterface
{
    public const string TABLE = 'consent_categories';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'ccg';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                = 'id';
    public const string ATTR_TENANT_ID         = 'tenant_id';
    public const string ATTR_KEY               = 'key';
    public const string ATTR_LABEL             = 'label';
    public const string ATTR_DESCRIPTION       = 'description';
    public const string ATTR_REQUIRES_GUARDIAN = 'requires_guardian';
    public const string ATTR_IS_SYSTEM         = 'is_system';
    public const string ATTR_IS_WITHDRAWABLE   = 'is_withdrawable';
    public const string ATTR_METADATA          = 'metadata';
    public const string ATTR_CREATED_BY        = 'created_by';
    public const string ATTR_UPDATED_BY        = 'updated_by';
    public const string ATTR_CREATED_AT        = 'created_at';
    public const string ATTR_UPDATED_AT        = 'updated_at';
}
