<?php

declare(strict_types=1);

namespace Academorix\Compliance\Models;

use Academorix\Compliance\Contracts\Data\ConsentRecordInterface;
use Academorix\Compliance\Database\Factories\ConsentRecordFactory;
use Academorix\Compliance\Enums\ConsentDecision;
use Academorix\Compliance\Observers\ConsentRecordObserver;
use Academorix\Compliance\Policies\ConsentRecordPolicy;
use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see ConsentRecordInterface}.
 *
 * Immutable — the observer refuses UPDATE on every column except
 * `metadata`. Withdrawal writes a NEW row rather than mutating the
 * previous grant.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Table(
    name: ConsentRecordInterface::TABLE,
    key: ConsentRecordInterface::PRIMARY_KEY,
    keyType: ConsentRecordInterface::KEY_TYPE,
)]
#[Fillable([
    ConsentRecordInterface::ATTR_TENANT_ID,
    ConsentRecordInterface::ATTR_CONSENT_CATEGORY_ID,
    ConsentRecordInterface::ATTR_CATEGORY_KEY,
    ConsentRecordInterface::ATTR_SUBJECT_TYPE,
    ConsentRecordInterface::ATTR_SUBJECT_ID,
    ConsentRecordInterface::ATTR_DECISION,
    ConsentRecordInterface::ATTR_GUARDIAN_USER_ID,
    ConsentRecordInterface::ATTR_VERIFICATION_METHOD,
    ConsentRecordInterface::ATTR_EVIDENCE,
    ConsentRecordInterface::ATTR_RECORDED_AT,
    ConsentRecordInterface::ATTR_SOURCE,
    ConsentRecordInterface::ATTR_METADATA,
])]
#[UseFactory(ConsentRecordFactory::class)]
#[UsePolicy(ConsentRecordPolicy::class)]
#[ObservedBy([ConsentRecordObserver::class])]
#[WithoutIncrementing]
final class ConsentRecord extends Model implements AuditableContract, ConsentRecordInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Cast map — enum + datetime + JSON coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        ConsentRecordInterface::ATTR_DECISION    => ConsentDecision::class,
        ConsentRecordInterface::ATTR_RECORDED_AT => 'datetime',
        ConsentRecordInterface::ATTR_EVIDENCE    => 'array',
    ];

    /**
     * The category this record decides.
     *
     * @return BelongsTo<ConsentCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(
            ConsentCategory::class,
            ConsentRecordInterface::ATTR_CONSENT_CATEGORY_ID,
        );
    }
}
