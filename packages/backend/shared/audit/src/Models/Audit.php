<?php

declare(strict_types=1);

namespace Stackra\Audit\Models;

use Stackra\Audit\Contracts\Data\AuditInterface;
use Stackra\Audit\Database\Factories\AuditFactory;
use Stackra\Audit\Observers\AuditObserver;
use Stackra\Audit\Policies\AuditPolicy;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenantOptional;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Models\Audit as OwenItAudit;

/**
 * Eloquent model for a persisted audit row.
 *
 * Extends `OwenIt\Auditing\Models\Audit` (the vendor's non-final base)
 * so every hook the vendor exposes (`getResolvedUrl`, `getMetadata`,
 * `getModified`, ...) keeps working. Our additions:
 *
 *   - `use HasPrefixedUlid` — primary key becomes `aud_<ulid>` on
 *     `creating`. Overrides the vendor's default bigint key.
 *   - `use BelongsToTenantOptional` — auto-fills `tenant_id` from the
 *     resolved tenant context on `saving`; leaves NULL for platform-
 *     plane operations.
 *   - `use HasMetadata` — free-form metadata satellites via
 *     `waad/laravel-model-metadata`. Sits ALONGSIDE the JSONB
 *     `metadata` column (structured operator notes vs schema-less bag).
 *   - `#[ObservedBy(AuditObserver::class)]` — the observer computes
 *     `chain_hash` on `creating` and emits `AuditRecorded` on `created`.
 *
 * ## What this class DOES NOT compose
 *
 *   - **NOT `SoftDeletes`** — audits are append-only. Deletion is a
 *     compliance failure surface, not a product one. The retention
 *     job anonymises + rotates rows; it never soft-deletes.
 *   - **NOT `Auditable`** — an audit row auditing itself would recurse.
 *   - **NOT `Userstamps`** — the row already captures `user_id` +
 *     `user_type` via owen-it. Adding created_by/updated_by would be
 *     duplicate authorship metadata.
 *
 * Not marked `final` because it extends owen-it's non-final base
 * and Eloquent's polymorphic morph maps expect a concrete class the
 * caller may want to subclass in a downstream extension.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[UseFactory(AuditFactory::class)]
#[UsePolicy(AuditPolicy::class)]
#[ObservedBy([AuditObserver::class])]
class Audit extends OwenItAudit implements AuditInterface
{
    use BelongsToTenantOptional;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;

    /**
     * We override the vendor's bigint key type — our migration adds
     * the `aud_<ulid>` string primary key.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Prefixed ULIDs are never auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * Cast map — the Stackra additions on top of owen-it's own
     * cast list (which handles `old_values`, `new_values`, `tags`).
     * The vendor's parent constructor merges this list with its own.
     *
     * @var array<string, string>
     */
    protected $casts = [
        AuditInterface::ATTR_OLD_VALUES        => 'json',
        AuditInterface::ATTR_NEW_VALUES        => 'json',
        AuditInterface::ATTR_METADATA          => 'array',
        AuditInterface::ATTR_CHAIN_VERIFIED_AT => 'datetime',
    ];

    /**
     * Fillable is intentionally NOT declared — owen-it uses the
     * inverse `$guarded = []` pattern so callers can pass every
     * column the auditor sets. Keeping that shape avoids surprising
     * the vendor's write path.
     *
     * @var array<int, string>
     */
    protected $guarded = [];

    /**
     * Foreign-key column resolver for `BelongsToTenantOptional`.
     *
     * The trait defaults to `tenant_id` — this override is defensive
     * in case a downstream renames the column.
     */
    public static function tenantForeignKey(): string
    {
        return AuditInterface::ATTR_TENANT_ID;
    }
}
