<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Contracts\Data;

use Academorix\Tenancy\Models\TenantContact;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `tenant_contacts` table.
 *
 * Named contact per Tenant, per role. GDPR Art. 30 (Records of
 * Processing) requires a legally-distinct DPO contact; enterprise
 * MSAs specify a legal-notice address; billing collects invoices at a
 * different address. This table separates them.
 *
 * At most one primary per `(tenant_id, kind)` — enforced by a partial
 * unique index (`is_primary = TRUE AND deleted_at IS NULL`).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Bind(TenantContact::class)]
interface TenantContactInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'tenant_contacts';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key column type — string, prefixed ULID (`wct_<26 chars>`).
     */
    public const string KEY_TYPE = 'string';

    /**
     * Prefix for the {@see \Academorix\Database\Concerns\HasPrefixedUlid}
     * trait — `wct_<ulid>` (per the tenant-contact schema keyPrefix).
     */
    public const string ID_PREFIX = 'wct';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID          = 'id';
    public const string ATTR_TENANT_ID   = 'tenant_id';
    public const string ATTR_KIND        = 'kind';
    public const string ATTR_NAME        = 'name';
    public const string ATTR_EMAIL       = 'email';
    public const string ATTR_PHONE       = 'phone';
    public const string ATTR_JOB_TITLE   = 'job_title';
    public const string ATTR_ADDRESS     = 'address';
    public const string ATTR_NOTES       = 'notes';
    public const string ATTR_IS_PRIMARY  = 'is_primary';
    public const string ATTR_VERIFIED_AT = 'verified_at';
    public const string ATTR_METADATA    = 'metadata';
    public const string ATTR_CREATED_BY  = 'created_by';
    public const string ATTR_UPDATED_BY  = 'updated_by';
    public const string ATTR_DELETED_BY  = 'deleted_by';
    public const string ATTR_CREATED_AT  = 'created_at';
    public const string ATTR_UPDATED_AT  = 'updated_at';
    public const string ATTR_DELETED_AT  = 'deleted_at';
}
