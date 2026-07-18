<?php

declare(strict_types=1);

namespace Academorix\Domains\Contracts\Data;

use Academorix\Domains\Models\DomainRecord;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `domain_records` table.
 *
 * DNS records we EXPECT a Domain to have. Diffed against real DNS by
 * `VerifyDomainDnsJob`. NOT authoritative — this table is our
 * expected-vs-observed diff, not the DNS zone itself.
 *
 * DomainRecord rows are hard-deleted (no SoftDeletes) — they are
 * diff-state, not compliance data.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Bind(DomainRecord::class)]
interface DomainRecordInterface
{
    public const string TABLE = 'domain_records';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'drc';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID              = 'id';
    public const string ATTR_TENANT_ID       = 'tenant_id';
    public const string ATTR_DOMAIN_ID       = 'domain_id';
    public const string ATTR_KIND            = 'kind';
    public const string ATTR_NAME            = 'name';
    public const string ATTR_EXPECTED_VALUE  = 'expected_value';
    public const string ATTR_LAST_SEEN_VALUE = 'last_seen_value';
    public const string ATTR_TTL_SECONDS     = 'ttl_seconds';
    public const string ATTR_PRIORITY        = 'priority';
    public const string ATTR_STATUS          = 'status';
    public const string ATTR_LAST_CHECK_AT   = 'last_check_at';
    public const string ATTR_LAST_MATCHED_AT = 'last_matched_at';
    public const string ATTR_LAST_ERROR      = 'last_error';
    public const string ATTR_METADATA        = 'metadata';
    public const string ATTR_CREATED_BY      = 'created_by';
    public const string ATTR_UPDATED_BY      = 'updated_by';
    public const string ATTR_CREATED_AT      = 'created_at';
    public const string ATTR_UPDATED_AT      = 'updated_at';
}
