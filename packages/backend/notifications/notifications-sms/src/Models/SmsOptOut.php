<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Stackra\Notifications\Sms\Database\Factories\SmsOptOutFactory;
use Stackra\Notifications\Sms\Enums\SmsOptOutReason;
use Stackra\Notifications\Sms\Enums\SmsProvider;
use Stackra\Notifications\Sms\Observers\SmsOptOutObserver;
use Stackra\Notifications\Sms\Policies\SmsOptOutPolicy;
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
 * Eloquent model for a {@see SmsOptOutInterface}.
 *
 * TCPA + CASL evidence-grade unsubscribe record. Every mutation is audit-
 * logged. `tenant_id` is nullable — `NULL` = platform-wide opt-out (global
 * bad-number list, spam-trap short codes).
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Table(
    name: SmsOptOutInterface::TABLE,
    key: SmsOptOutInterface::PRIMARY_KEY,
    keyType: SmsOptOutInterface::KEY_TYPE,
)]
#[Fillable([
    SmsOptOutInterface::ATTR_TENANT_ID,
    SmsOptOutInterface::ATTR_PHONE,
    SmsOptOutInterface::ATTR_PHONE_COUNTRY_CODE,
    SmsOptOutInterface::ATTR_REASON,
    SmsOptOutInterface::ATTR_PROVIDER,
    SmsOptOutInterface::ATTR_SOURCE_DELIVERY_ID,
    SmsOptOutInterface::ATTR_INBOUND_MESSAGE_BODY,
    SmsOptOutInterface::ATTR_IS_SYSTEM,
    SmsOptOutInterface::ATTR_OPTED_OUT_AT,
    SmsOptOutInterface::ATTR_EXPIRES_AT,
    SmsOptOutInterface::ATTR_METADATA,
])]
#[UseFactory(SmsOptOutFactory::class)]
#[UsePolicy(SmsOptOutPolicy::class)]
#[ObservedBy([SmsOptOutObserver::class])]
#[WithoutIncrementing]
final class SmsOptOut extends Model implements AuditableContract, SmsOptOutInterface
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + booleans + datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SmsOptOutInterface::ATTR_REASON       => SmsOptOutReason::class,
        SmsOptOutInterface::ATTR_PROVIDER     => SmsProvider::class,
        SmsOptOutInterface::ATTR_IS_SYSTEM    => 'boolean',
        SmsOptOutInterface::ATTR_OPTED_OUT_AT => 'datetime',
        SmsOptOutInterface::ATTR_EXPIRES_AT   => 'datetime',
        SmsOptOutInterface::ATTR_METADATA     => 'array',
    ];

    /**
     * NOT composing `BelongsToTenant` because tenant scoping is OPTIONAL —
     * platform-wide opt-outs legitimately carry `tenant_id = NULL`. Callers
     * that need tenant filtering do so explicitly in the repository.
     */
    public function isSystem(): bool
    {
        return (bool) $this->{SmsOptOutInterface::ATTR_IS_SYSTEM};
    }

    /**
     * Whether the opt-out is still in force (`expires_at` is null or in the
     * future).
     */
    public function isActive(): bool
    {
        $expiresAt = $this->{SmsOptOutInterface::ATTR_EXPIRES_AT};

        return $expiresAt === null || $expiresAt->isFuture();
    }
}
