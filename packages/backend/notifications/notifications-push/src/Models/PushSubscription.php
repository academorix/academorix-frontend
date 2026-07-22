<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Models;

use Stackra\Application\Concerns\BelongsToApplication;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Stackra\Notifications\Push\Database\Factories\PushSubscriptionFactory;
use Stackra\Notifications\Push\Enums\PushPlatform;
use Stackra\Notifications\Push\Enums\PushProvider;
use Stackra\Notifications\Push\Observers\PushSubscriptionObserver;
use Stackra\Notifications\Push\Policies\PushSubscriptionPolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
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
 * Eloquent model for a {@see PushSubscriptionInterface}.
 *
 * One device-token registration per (user, application, device). The token
 * itself is RESTRICTED tier — AES-256 encrypted via the `encrypted` cast +
 * marked `#[Hidden]` so it can never leak into an API response by accident.
 * The audit log deliberately omits the `device_token` field (only the
 * fingerprint, provider, platform, and lifecycle timestamps are audit-worthy).
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Table(
    name: PushSubscriptionInterface::TABLE,
    key: PushSubscriptionInterface::PRIMARY_KEY,
    keyType: PushSubscriptionInterface::KEY_TYPE,
)]
#[Fillable([
    PushSubscriptionInterface::ATTR_TENANT_ID,
    PushSubscriptionInterface::ATTR_APPLICATION_ID,
    PushSubscriptionInterface::ATTR_USER_ID,
    PushSubscriptionInterface::ATTR_PROVIDER,
    PushSubscriptionInterface::ATTR_PLATFORM,
    PushSubscriptionInterface::ATTR_DEVICE_TOKEN,
    PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT,
    PushSubscriptionInterface::ATTR_DEVICE_NAME,
    PushSubscriptionInterface::ATTR_APP_VERSION,
    PushSubscriptionInterface::ATTR_OS_VERSION,
    PushSubscriptionInterface::ATTR_LOCALE,
    PushSubscriptionInterface::ATTR_TIMEZONE,
    PushSubscriptionInterface::ATTR_IS_ACTIVE,
    PushSubscriptionInterface::ATTR_LAST_SEEN_AT,
    PushSubscriptionInterface::ATTR_EXPIRES_AT,
    PushSubscriptionInterface::ATTR_INVALID_TOKEN_REPORTED_AT,
    PushSubscriptionInterface::ATTR_METADATA,
])]
#[Hidden([
    PushSubscriptionInterface::ATTR_DEVICE_TOKEN,
])]
#[UseFactory(PushSubscriptionFactory::class)]
#[UsePolicy(PushSubscriptionPolicy::class)]
#[ObservedBy([PushSubscriptionObserver::class])]
#[WithoutIncrementing]
final class PushSubscription extends Model implements AuditableContract, PushSubscriptionInterface
{
    use Auditable;
    use BelongsToApplication;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + booleans + datetimes coerced on hydrate. The
     * `device_token` field carries Laravel's built-in `encrypted` cast so the
     * plaintext token never lives on disk.
     *
     * @var array<string, string>
     */
    protected $casts = [
        PushSubscriptionInterface::ATTR_PROVIDER                  => PushProvider::class,
        PushSubscriptionInterface::ATTR_PLATFORM                  => PushPlatform::class,
        PushSubscriptionInterface::ATTR_DEVICE_TOKEN              => 'encrypted',
        PushSubscriptionInterface::ATTR_IS_ACTIVE                 => 'boolean',
        PushSubscriptionInterface::ATTR_LAST_SEEN_AT              => 'datetime',
        PushSubscriptionInterface::ATTR_EXPIRES_AT                => 'datetime',
        PushSubscriptionInterface::ATTR_INVALID_TOKEN_REPORTED_AT => 'datetime',
        PushSubscriptionInterface::ATTR_METADATA                  => 'array',
    ];

    /**
     * Auditable — device_token is NEVER audit-logged (RESTRICTED tier). The
     * fingerprint + lifecycle metadata carry all the disputable meaning.
     *
     * @var array<int, string>
     */
    protected array $auditInclude = [
        PushSubscriptionInterface::ATTR_PROVIDER,
        PushSubscriptionInterface::ATTR_PLATFORM,
        PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT,
        PushSubscriptionInterface::ATTR_DEVICE_NAME,
        PushSubscriptionInterface::ATTR_IS_ACTIVE,
        PushSubscriptionInterface::ATTR_INVALID_TOKEN_REPORTED_AT,
    ];

    /**
     * Whether the subscription is available for delivery attempts.
     */
    public function isActive(): bool
    {
        return (bool) $this->{PushSubscriptionInterface::ATTR_IS_ACTIVE}
            && $this->{PushSubscriptionInterface::ATTR_INVALID_TOKEN_REPORTED_AT} === null;
    }
}
