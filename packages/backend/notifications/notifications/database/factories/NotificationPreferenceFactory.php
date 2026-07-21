<?php

declare(strict_types=1);

namespace Stackra\Notifications\Database\Factories;

use Stackra\Notifications\Contracts\Data\NotificationPreferenceInterface;
use Stackra\Notifications\Enums\DigestMode;
use Stackra\Notifications\Enums\NotificationChannel;
use Stackra\Notifications\Models\NotificationPreference;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see NotificationPreference}.
 *
 * @extends Factory<NotificationPreference>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationPreferenceFactory extends Factory
{
    /**
     * @var class-string<NotificationPreference>
     */
    protected $model = NotificationPreference::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            NotificationPreferenceInterface::ATTR_ID            => 'pref_' . Str::ulid()->toBase32(),
            NotificationPreferenceInterface::ATTR_TENANT_ID     => 'ten_' . Str::ulid()->toBase32(),
            NotificationPreferenceInterface::ATTR_USER_ID       => 'usr_' . Str::ulid()->toBase32(),
            NotificationPreferenceInterface::ATTR_CATEGORY_SLUG => 'system.notification',
            NotificationPreferenceInterface::ATTR_CHANNEL       => NotificationChannel::InApp->value,
            NotificationPreferenceInterface::ATTR_ENABLED       => true,
            NotificationPreferenceInterface::ATTR_DIGEST_MODE   => DigestMode::Immediate->value,
        ];
    }

    /**
     * State — the preference is opted out.
     */
    public function optedOut(): static
    {
        return $this->state(fn (): array => [
            NotificationPreferenceInterface::ATTR_ENABLED => false,
        ]);
    }
}
