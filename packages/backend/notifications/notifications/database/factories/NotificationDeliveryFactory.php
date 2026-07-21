<?php

declare(strict_types=1);

namespace Stackra\Notifications\Database\Factories;

use Stackra\Notifications\Contracts\Data\NotificationDeliveryInterface;
use Stackra\Notifications\Enums\NotificationChannel;
use Stackra\Notifications\Enums\NotificationStatus;
use Stackra\Notifications\Models\NotificationDelivery;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see NotificationDelivery}.
 *
 * @extends Factory<NotificationDelivery>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationDeliveryFactory extends Factory
{
    /**
     * @var class-string<NotificationDelivery>
     */
    protected $model = NotificationDelivery::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            NotificationDeliveryInterface::ATTR_ID              => 'delv_' . Str::ulid()->toBase32(),
            NotificationDeliveryInterface::ATTR_TENANT_ID       => 'ten_' . Str::ulid()->toBase32(),
            NotificationDeliveryInterface::ATTR_NOTIFICATION_ID => 'not_' . Str::ulid()->toBase32(),
            NotificationDeliveryInterface::ATTR_CHANNEL         => NotificationChannel::InApp->value,
            NotificationDeliveryInterface::ATTR_PROVIDER        => 'default',
            NotificationDeliveryInterface::ATTR_STATE           => NotificationStatus::Queued->value,
            NotificationDeliveryInterface::ATTR_ATTEMPT         => 1,
            NotificationDeliveryInterface::ATTR_RETRY_COUNT     => 0,
        ];
    }

    /**
     * State — the delivery has been sent to the provider.
     */
    public function sent(): static
    {
        return $this->state(fn (): array => [
            NotificationDeliveryInterface::ATTR_STATE        => NotificationStatus::Sent->value,
            NotificationDeliveryInterface::ATTR_ATTEMPTED_AT => \now(),
        ]);
    }

    /**
     * State — the delivery was confirmed by the provider.
     */
    public function delivered(): static
    {
        return $this->state(fn (): array => [
            NotificationDeliveryInterface::ATTR_STATE         => NotificationStatus::Delivered->value,
            NotificationDeliveryInterface::ATTR_ATTEMPTED_AT  => \now()->subMinute(),
            NotificationDeliveryInterface::ATTR_DELIVERED_AT  => \now(),
        ]);
    }

    /**
     * State — the delivery failed after exhausting retries.
     */
    public function failed(): static
    {
        return $this->state(fn (): array => [
            NotificationDeliveryInterface::ATTR_STATE         => NotificationStatus::Failed->value,
            NotificationDeliveryInterface::ATTR_ATTEMPTED_AT  => \now()->subMinute(),
            NotificationDeliveryInterface::ATTR_FAILED_AT     => \now(),
            NotificationDeliveryInterface::ATTR_ERROR_CODE    => 'NOTIFICATIONS_PROVIDER_ERROR',
        ]);
    }
}
