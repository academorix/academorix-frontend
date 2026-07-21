<?php

declare(strict_types=1);

namespace Stackra\Notifications\Database\Factories;

use Stackra\Notifications\Contracts\Data\NotificationDigestInterface;
use Stackra\Notifications\Enums\DigestState;
use Stackra\Notifications\Enums\NotificationChannel;
use Stackra\Notifications\Models\NotificationDigest;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see NotificationDigest}.
 *
 * @extends Factory<NotificationDigest>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationDigestFactory extends Factory
{
    /**
     * @var class-string<NotificationDigest>
     */
    protected $model = NotificationDigest::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            NotificationDigestInterface::ATTR_ID               => 'dgst_' . Str::ulid()->toBase32(),
            NotificationDigestInterface::ATTR_TENANT_ID        => 'ten_' . Str::ulid()->toBase32(),
            NotificationDigestInterface::ATTR_USER_ID          => 'usr_' . Str::ulid()->toBase32(),
            NotificationDigestInterface::ATTR_CATEGORY_SLUG    => 'system.notification',
            NotificationDigestInterface::ATTR_CHANNEL          => NotificationChannel::Mail->value,
            NotificationDigestInterface::ATTR_STATE            => DigestState::Pending->value,
            NotificationDigestInterface::ATTR_SCHEDULED_FOR    => \now()->addHours(8),
            NotificationDigestInterface::ATTR_NOTIFICATION_IDS => [],
        ];
    }

    /**
     * State — the digest has been delivered.
     */
    public function delivered(): static
    {
        return $this->state(fn (): array => [
            NotificationDigestInterface::ATTR_STATE        => DigestState::Delivered->value,
            NotificationDigestInterface::ATTR_DELIVERED_AT => \now(),
        ]);
    }
}
