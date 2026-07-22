<?php

declare(strict_types=1);

namespace Stackra\Compliance\Models;

use Stackra\Compliance\Contracts\Data\LegalHoldInterface;
use Stackra\Compliance\Database\Factories\LegalHoldFactory;
use Stackra\Compliance\Enums\LegalHoldScope;
use Stackra\Compliance\Observers\LegalHoldObserver;
use Stackra\Compliance\Policies\LegalHoldPolicy;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see LegalHoldInterface}.
 *
 * Freezes retention on a subject / tenant / case / class scope.
 * Two-person approval — the observer refuses creates that lack
 * `applied_by_user_id` + `approved_by_user_id`.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Table(
    name: LegalHoldInterface::TABLE,
    key: LegalHoldInterface::PRIMARY_KEY,
    keyType: LegalHoldInterface::KEY_TYPE,
)]
#[Fillable([
    LegalHoldInterface::ATTR_TENANT_ID,
    LegalHoldInterface::ATTR_SCOPE,
    LegalHoldInterface::ATTR_SUBJECT_TYPE,
    LegalHoldInterface::ATTR_SUBJECT_ID,
    LegalHoldInterface::ATTR_TARGET_CLASS,
    LegalHoldInterface::ATTR_CASE_REF,
    LegalHoldInterface::ATTR_APPLIED_BY_USER_ID,
    LegalHoldInterface::ATTR_APPROVED_BY_USER_ID,
    LegalHoldInterface::ATTR_REASON,
    LegalHoldInterface::ATTR_APPLIED_AT,
    LegalHoldInterface::ATTR_EXPIRES_AT,
    LegalHoldInterface::ATTR_RELEASED_AT,
    LegalHoldInterface::ATTR_RELEASED_BY_USER_ID,
    LegalHoldInterface::ATTR_METADATA,
])]
#[UseFactory(LegalHoldFactory::class)]
#[UsePolicy(LegalHoldPolicy::class)]
#[ObservedBy([LegalHoldObserver::class])]
#[WithoutIncrementing]
final class LegalHold extends Model implements AuditableContract, LegalHoldInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enum + datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        LegalHoldInterface::ATTR_SCOPE       => LegalHoldScope::class,
        LegalHoldInterface::ATTR_APPLIED_AT  => 'datetime',
        LegalHoldInterface::ATTR_EXPIRES_AT  => 'datetime',
        LegalHoldInterface::ATTR_RELEASED_AT => 'datetime',
    ];

    /**
     * Whether the hold is currently active (not released, not
     * expired).
     */
    public function isActive(): bool
    {
        if ($this->{LegalHoldInterface::ATTR_RELEASED_AT} !== null) {
            return false;
        }

        $expires = $this->{LegalHoldInterface::ATTR_EXPIRES_AT};

        return $expires === null || $expires->isFuture();
    }
}
