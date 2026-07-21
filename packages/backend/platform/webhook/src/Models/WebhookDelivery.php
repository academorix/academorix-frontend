<?php

declare(strict_types=1);

namespace Stackra\Webhook\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Stackra\Webhook\Casts\WebhookPayloadCast;
use Stackra\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Stackra\Webhook\Database\Factories\WebhookDeliveryFactory;
use Stackra\Webhook\Enums\WebhookDeliveryStatus;
use Stackra\Webhook\Observers\WebhookDeliveryObserver;
use Stackra\Webhook\Policies\WebhookDeliveryPolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
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
 * Eloquent model for a {@see WebhookDeliveryInterface}.
 *
 * Append-only per-attempt audit row. NO soft deletes — retention is
 * handled by {@see \Stackra\Webhook\Jobs\PruneWebhookDeliveriesJob}.
 * The payload is encrypted-at-rest and hidden from wire responses;
 * consumers read the metadata (status / attempt / latency) instead.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Table(
    name: WebhookDeliveryInterface::TABLE,
    key: WebhookDeliveryInterface::PRIMARY_KEY,
    keyType: WebhookDeliveryInterface::KEY_TYPE,
)]
#[Fillable([
    WebhookDeliveryInterface::ATTR_TENANT_ID,
    WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID,
    WebhookDeliveryInterface::ATTR_EVENT_NAME,
    WebhookDeliveryInterface::ATTR_EVENT_ID,
    WebhookDeliveryInterface::ATTR_API_VERSION,
    WebhookDeliveryInterface::ATTR_PAYLOAD,
    WebhookDeliveryInterface::ATTR_PAYLOAD_HASH,
    WebhookDeliveryInterface::ATTR_ATTEMPT,
    WebhookDeliveryInterface::ATTR_STATUS,
    WebhookDeliveryInterface::ATTR_HTTP_STATUS_CODE,
    WebhookDeliveryInterface::ATTR_RESPONSE_HEADERS,
    WebhookDeliveryInterface::ATTR_RESPONSE_BODY,
    WebhookDeliveryInterface::ATTR_LATENCY_MS,
    WebhookDeliveryInterface::ATTR_DISPATCHED_AT,
    WebhookDeliveryInterface::ATTR_DELIVERED_AT,
    WebhookDeliveryInterface::ATTR_FAILED_AT,
    WebhookDeliveryInterface::ATTR_RETRY_AT,
    WebhookDeliveryInterface::ATTR_ERROR_MESSAGE,
    WebhookDeliveryInterface::ATTR_METADATA,
])]
#[Hidden([
    WebhookDeliveryInterface::ATTR_PAYLOAD,
])]
#[UseFactory(WebhookDeliveryFactory::class)]
#[UsePolicy(WebhookDeliveryPolicy::class)]
#[ObservedBy([WebhookDeliveryObserver::class])]
#[WithoutIncrementing]
final class WebhookDelivery extends Model implements AuditableContract, WebhookDeliveryInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Cast map — enum + JSON + integer + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        WebhookDeliveryInterface::ATTR_STATUS           => WebhookDeliveryStatus::class,
        WebhookDeliveryInterface::ATTR_PAYLOAD          => WebhookPayloadCast::class,
        WebhookDeliveryInterface::ATTR_RESPONSE_HEADERS => 'array',
        WebhookDeliveryInterface::ATTR_METADATA         => 'array',
        WebhookDeliveryInterface::ATTR_DISPATCHED_AT    => 'datetime',
        WebhookDeliveryInterface::ATTR_DELIVERED_AT     => 'datetime',
        WebhookDeliveryInterface::ATTR_FAILED_AT        => 'datetime',
        WebhookDeliveryInterface::ATTR_RETRY_AT         => 'datetime',
        WebhookDeliveryInterface::ATTR_ATTEMPT          => 'integer',
        WebhookDeliveryInterface::ATTR_HTTP_STATUS_CODE => 'integer',
        WebhookDeliveryInterface::ATTR_LATENCY_MS       => 'integer',
    ];

    /**
     * Parent subscription.
     *
     * @return BelongsTo<WebhookSubscription, $this>
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(
            WebhookSubscription::class,
            WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID,
            WebhookSubscriptionInterface::ATTR_ID,
        );
    }

    /**
     * Whether the delivery reached a terminal state.
     */
    public function isTerminal(): bool
    {
        $status = $this->{WebhookDeliveryInterface::ATTR_STATUS};

        return $status === WebhookDeliveryStatus::Delivered
            || $status === WebhookDeliveryStatus::FailedPermanent
            || $status === WebhookDeliveryStatus::Delivered->value
            || $status === WebhookDeliveryStatus::FailedPermanent->value;
    }
}
