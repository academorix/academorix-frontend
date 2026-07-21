<?php

declare(strict_types=1);

namespace Stackra\Notifications\Database\Factories;

use Stackra\Notifications\Contracts\Data\NotificationInterface;
use Stackra\Notifications\Enums\NotificationPriority;
use Stackra\Notifications\Enums\NotificationStatus;
use Stackra\Notifications\Models\Notification;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Notification}.
 *
 * @extends Factory<Notification>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationFactory extends Factory
{
    /**
     * @var class-string<Notification>
     */
    protected $model = Notification::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            NotificationInterface::ATTR_ID                     => 'not_' . Str::ulid()->toBase32(),
            NotificationInterface::ATTR_TENANT_ID              => 'ten_' . Str::ulid()->toBase32(),
            NotificationInterface::ATTR_APPLICATION_ID         => null,
            NotificationInterface::ATTR_CATEGORY_SLUG          => 'system.notification',
            NotificationInterface::ATTR_TEMPLATE_KEY           => 'system.notification',
            NotificationInterface::ATTR_PRIORITY               => NotificationPriority::Product->value,
            NotificationInterface::ATTR_STATE                  => NotificationStatus::Queued->value,
            NotificationInterface::ATTR_ADDRESSEE_TYPE         => 'user',
            NotificationInterface::ATTR_ADDRESSEE_ID           => 'usr_' . Str::ulid()->toBase32(),
            NotificationInterface::ATTR_ADDRESSEE_EMAIL        => '[email protected]',
            NotificationInterface::ATTR_ADDRESSEE_PHONE        => null,
            NotificationInterface::ATTR_ADDRESSEE_NAME         => 'Test Recipient',
            NotificationInterface::ATTR_ADDRESSEE_LOCALE       => 'en',
            NotificationInterface::ATTR_ADDRESSEE_TIMEZONE     => 'UTC',
            NotificationInterface::ATTR_ACTOR_TYPE             => 'system',
            NotificationInterface::ATTR_PAYLOAD                => [],
        ];
    }

    /**
     * State — mark this notification as seen.
     */
    public function seen(): static
    {
        return $this->state(fn (): array => [
            NotificationInterface::ATTR_SEEN_AT => \now(),
        ]);
    }

    /**
     * State — mark this notification as archived.
     */
    public function archived(): static
    {
        return $this->state(fn (): array => [
            NotificationInterface::ATTR_ARCHIVED_AT => \now(),
        ]);
    }
}
