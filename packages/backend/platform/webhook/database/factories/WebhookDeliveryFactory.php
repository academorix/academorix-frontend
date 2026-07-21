<?php

declare(strict_types=1);

namespace Stackra\Webhook\Database\Factories;

use Stackra\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Stackra\Webhook\Enums\WebhookDeliveryStatus;
use Stackra\Webhook\Models\WebhookDelivery;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see WebhookDelivery}.
 *
 * @extends Factory<WebhookDelivery>
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class WebhookDeliveryFactory extends Factory
{
    /**
     * @var class-string<WebhookDelivery>
     */
    protected $model = WebhookDelivery::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $payload = ['event' => 'tenant.created', 'tenant_id' => 'ten_test'];
        $hash    = \hash(
            'sha256',
            (string) \json_encode($payload, \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES),
        );

        return [
            WebhookDeliveryInterface::ATTR_ID               => 'whd_' . Str::ulid()->toBase32(),
            WebhookDeliveryInterface::ATTR_TENANT_ID        => 'ten_' . Str::ulid()->toBase32(),
            WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID  => 'whs_' . Str::ulid()->toBase32(),
            WebhookDeliveryInterface::ATTR_EVENT_NAME       => 'tenant.created',
            WebhookDeliveryInterface::ATTR_EVENT_ID         => (string) Str::ulid(),
            WebhookDeliveryInterface::ATTR_API_VERSION      => 'v1',
            WebhookDeliveryInterface::ATTR_PAYLOAD          => $payload,
            WebhookDeliveryInterface::ATTR_PAYLOAD_HASH     => $hash,
            WebhookDeliveryInterface::ATTR_ATTEMPT          => 1,
            WebhookDeliveryInterface::ATTR_STATUS           => WebhookDeliveryStatus::Pending->value,
        ];
    }

    public function delivered(): static
    {
        return $this->state(fn (): array => [
            WebhookDeliveryInterface::ATTR_STATUS           => WebhookDeliveryStatus::Delivered->value,
            WebhookDeliveryInterface::ATTR_HTTP_STATUS_CODE => 200,
            WebhookDeliveryInterface::ATTR_DISPATCHED_AT    => \now()->subSecond(),
            WebhookDeliveryInterface::ATTR_DELIVERED_AT     => \now(),
            WebhookDeliveryInterface::ATTR_LATENCY_MS       => 42,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (): array => [
            WebhookDeliveryInterface::ATTR_STATUS           => WebhookDeliveryStatus::Failed->value,
            WebhookDeliveryInterface::ATTR_HTTP_STATUS_CODE => 500,
            WebhookDeliveryInterface::ATTR_DISPATCHED_AT    => \now()->subSecond(),
            WebhookDeliveryInterface::ATTR_FAILED_AT        => \now(),
            WebhookDeliveryInterface::ATTR_RETRY_AT         => \now()->addMinute(),
            WebhookDeliveryInterface::ATTR_ERROR_MESSAGE    => 'http_500',
        ]);
    }

    public function failedPermanent(): static
    {
        return $this->state(fn (): array => [
            WebhookDeliveryInterface::ATTR_STATUS           => WebhookDeliveryStatus::FailedPermanent->value,
            WebhookDeliveryInterface::ATTR_HTTP_STATUS_CODE => 410,
            WebhookDeliveryInterface::ATTR_DISPATCHED_AT    => \now()->subSecond(),
            WebhookDeliveryInterface::ATTR_FAILED_AT        => \now(),
            WebhookDeliveryInterface::ATTR_ERROR_MESSAGE    => 'http_410',
        ]);
    }
}
