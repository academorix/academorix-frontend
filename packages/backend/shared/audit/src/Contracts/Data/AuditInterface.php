<?php

declare(strict_types=1);

namespace Stackra\Audit\Contracts\Data;

use Stackra\Audit\Models\Audit;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `audits` table.
 *
 * Extends owen-it/laravel-auditing's default column set with the four
 * Stackra additions:
 *
 *   - `tenant_id` — nullable ULID pointing at the owning tenant. NULL
 *     for system-plane audits (platform-admin operations, catalogue
 *     seeding). Composed via `BelongsToTenantOptional` on the model.
 *   - `chain_hash` — SHA-512 hex digest of the canonical row
 *     serialisation + the previous row's `chain_hash`. Enterprise
 *     tamper-evidence chain; NULL for tenants without the entitlement.
 *   - `chain_verified_at` — last time `VerifyAuditChainJob` walked past
 *     this row without detecting a mismatch.
 *   - `metadata` — free-form JSONB satellite. Sits alongside owen-it's
 *     `tags` column; carries structured operator notes.
 *
 * The owen-it base migration ships the rest (user_type, user_id, event,
 * auditable_type, auditable_id, old_values, new_values, url,
 * ip_address, user_agent, tags, created_at, updated_at). Our migration
 * only adds the four columns above.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Bind(Audit::class)]
interface AuditInterface
{
    public const string TABLE = 'audits';

    public const string PRIMARY_KEY = 'id';

    /**
     * owen-it's default migration uses a BIGINT auto-increment id.
     * We keep the string key type here because our HasPrefixedUlid
     * trait fills it with an `aud_<ulid>` value on `creating`, and
     * the composer app is responsible for casting the column to
     * string(64) if the vendor's default bigint isn't wanted.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — read by `HasPrefixedUlid` at `creating`.
     */
    public const string ID_PREFIX = 'aud';

    // ── Columns (owen-it base) ─────────────────────────────────────

    public const string ATTR_ID              = 'id';
    public const string ATTR_USER_TYPE       = 'user_type';
    public const string ATTR_USER_ID         = 'user_id';
    public const string ATTR_EVENT           = 'event';
    public const string ATTR_AUDITABLE_TYPE  = 'auditable_type';
    public const string ATTR_AUDITABLE_ID    = 'auditable_id';
    public const string ATTR_OLD_VALUES      = 'old_values';
    public const string ATTR_NEW_VALUES      = 'new_values';
    public const string ATTR_URL             = 'url';
    public const string ATTR_IP_ADDRESS      = 'ip_address';
    public const string ATTR_USER_AGENT      = 'user_agent';
    public const string ATTR_TAGS            = 'tags';
    public const string ATTR_CREATED_AT      = 'created_at';
    public const string ATTR_UPDATED_AT      = 'updated_at';

    // ── Columns (Stackra additions) ─────────────────────────────

    public const string ATTR_TENANT_ID          = 'tenant_id';
    public const string ATTR_CHAIN_HASH         = 'chain_hash';
    public const string ATTR_CHAIN_VERIFIED_AT  = 'chain_verified_at';
    public const string ATTR_METADATA           = 'metadata';
}
