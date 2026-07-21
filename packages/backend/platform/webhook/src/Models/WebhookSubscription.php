<?php

declare(strict_types=1);

namespace Stackra\Webhook\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Stackra\Webhook\Casts\BackoffConfigCast;
use Stackra\Webhook\Casts\DestinationConfigCast;
use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Stackra\Webhook\Database\Factories\WebhookSubscriptionFactory;
use Stackra\Webhook\Enums\WebhookProbeStatus;
use Stackra\Webhook\Enums\WebhookSubscriptionStatus;
use Stackra\Webhook\Observers\WebhookSubscriptionObserver;
use Stackra\Webhook\Policies\WebhookSubscriptionPolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see WebhookSubscriptionInterface}.
 *
 * One customer-registered subscription. Composes `BelongsToTenant`
 * so every read/write auto-scopes to the active tenant. The signing
 * secret + rotation-grace previous secret are `#[Hidden]` — they are
 * NEVER returned by wire responses.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Table(
    name: WebhookSubscriptionInterface::TABLE,
    key: WebhookSubscriptionInterface::PRIMARY_KEY,
    keyType: WebhookSubscriptionInterface::KEY_TYPE,
)]
#[Fillable([
    WebhookSubscriptionInterface::ATTR_TENANT_ID,
    WebhookSubscriptionInterface::ATTR_NAME,
    WebhookSubscriptionInterface::ATTR_DESTINATION,
    WebhookSubscriptionInterface::ATTR_DESTINATION_CONFIG,
    WebhookSubscriptionInterface::ATTR_EVENTS,
    WebhookSubscriptionInterface::ATTR_SIGNING_SECRET,
    WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_PREVIOUS,
    WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_ROTATED_AT,
    WebhookSubscriptionInterface::ATTR_API_VERSION,
    WebhookSubscriptionInterface::ATTR_STATUS,
    WebhookSubscriptionInterface::ATTR_CONSECUTIVE_FAILURES,
    WebhookSubscriptionInterface::ATTR_DISABLED_AT,
    WebhookSubscriptionInterface::ATTR_DISABLED_REASON,
    WebhookSubscriptionInterface::ATTR_RATE_LIMIT_PER_MINUTE,
    WebhookSubscriptionInterface::ATTR_BACKOFF_STRATEGY,
    WebhookSubscriptionInterface::ATTR_BACKOFF_CONFIG,
    WebhookSubscriptionInterface::ATTR_LAST_DELIVERY_AT,
    WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_URL,
    WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_LAST_AT,
    WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_STATUS,
    WebhookSubscriptionInterface::ATTR_METADATA,
])]
#[Hidden([
    WebhookSubscriptionInterface::ATTR_SIGNING_SECRET,
    WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_PREVIOUS,
])]
#[UseFactory(WebhookSubscriptionFactory::class)]
#[UsePolicy(WebhookSubscriptionPolicy::class)]
#[ObservedBy([WebhookSubscriptionObserver::class])]
#[WithoutIncrementing]
final class WebhookSubscription extends Model implements AuditableContract, WebhookSubscriptionInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + JSON + booleans + datetimes coerced on hydrate.
     * `signing_secret` and `signing_secret_previous` use Laravel's
     * built-in `encrypted` cast so the encryption boundary matches
     * the destination-config cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        WebhookSubscriptionInterface::ATTR_STATUS                    => WebhookSubscriptionStatus::class,
        WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_STATUS       => WebhookProbeStatus::class,
        WebhookSubscriptionInterface::ATTR_EVENTS                    => 'array',
        WebhookSubscriptionInterface::ATTR_DESTINATION_CONFIG        => DestinationConfigCast::class,
        WebhookSubscriptionInterface::ATTR_BACKOFF_CONFIG            => BackoffConfigCast::class,
        WebhookSubscriptionInterface::ATTR_METADATA                  => 'array',
        WebhookSubscriptionInterface::ATTR_SIGNING_SECRET            => 'encrypted',
        WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_PREVIOUS   => 'encrypted',
        WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_ROTATED_AT => 'datetime',
        WebhookSubscriptionInterface::ATTR_DISABLED_AT               => 'datetime',
        WebhookSubscriptionInterface::ATTR_LAST_DELIVERY_AT          => 'datetime',
        WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_LAST_AT      => 'datetime',
        WebhookSubscriptionInterface::ATTR_CONSECUTIVE_FAILURES      => 'integer',
        WebhookSubscriptionInterface::ATTR_RATE_LIMIT_PER_MINUTE     => 'integer',
    ];

    /**
     * Deliveries dispatched through this subscription.
     *
     * @return HasMany<WebhookDelivery, $this>
     */
    public function deliveries(): HasMany
    {
        return $this->hasMany(
            WebhookDelivery::class,
            \Stackra\Webhook\Contracts\Data\WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID,
        );
    }

    /**
     * Whether the subscription is dispatching normally.
     */
    public function isActive(): bool
    {
        $status = $this->{WebhookSubscriptionInterface::ATTR_STATUS};

        return $status === WebhookSubscriptionStatus::Active
            || $status === WebhookSubscriptionStatus::Active->value;
    }

    /**
     * Whether the previous secret is still within the rotation grace
     * window.
     */
    public function hasRotationGrace(): bool
    {
        if ($this->{WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_PREVIOUS} === null) {
            return false;
        }

        $rotatedAt = $this->{WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_ROTATED_AT};
        if ($rotatedAt === null) {
            return false;
        }

        $graceSeconds = (int) \config('webhook.signing.rotation_grace_seconds', 86400);

        return $rotatedAt->clone()->addSeconds($graceSeconds)->isFuture();
    }
}
