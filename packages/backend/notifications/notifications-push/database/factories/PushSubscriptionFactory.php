<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Database\Factories;

use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Stackra\Notifications\Push\Enums\PushPlatform;
use Stackra\Notifications\Push\Enums\PushProvider;
use Stackra\Notifications\Push\Models\PushSubscription;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see PushSubscription}.
 *
 * Produces an FCM Android subscription with a random hex device token. States
 * (`->apns()`, `->expo()`, `->onesignal()`, `->inactive()`) attach the
 * provider-specific variants tests need.
 *
 * @extends Factory<PushSubscription>
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
final class PushSubscriptionFactory extends Factory
{
    /**
     * @var class-string<PushSubscription>
     */
    protected $model = PushSubscription::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $token = \bin2hex(\random_bytes(80));

        return [
            PushSubscriptionInterface::ATTR_ID                       => 'psub_' . Str::ulid()->toBase32(),
            PushSubscriptionInterface::ATTR_TENANT_ID                => 'ten_' . Str::ulid()->toBase32(),
            PushSubscriptionInterface::ATTR_APPLICATION_ID           => 'app_' . Str::ulid()->toBase32(),
            PushSubscriptionInterface::ATTR_USER_ID                  => (string) Str::uuid(),
            PushSubscriptionInterface::ATTR_PROVIDER                 => PushProvider::Fcm->value,
            PushSubscriptionInterface::ATTR_PLATFORM                 => PushPlatform::Android->value,
            PushSubscriptionInterface::ATTR_DEVICE_TOKEN             => $token,
            PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT => \hash('sha256', $token),
            PushSubscriptionInterface::ATTR_DEVICE_NAME              => $this->faker->word() . '\'s Pixel',
            PushSubscriptionInterface::ATTR_APP_VERSION              => '1.0.0',
            PushSubscriptionInterface::ATTR_OS_VERSION               => 'Android 14',
            PushSubscriptionInterface::ATTR_LOCALE                   => 'en',
            PushSubscriptionInterface::ATTR_TIMEZONE                 => 'UTC',
            PushSubscriptionInterface::ATTR_IS_ACTIVE                => true,
            PushSubscriptionInterface::ATTR_LAST_SEEN_AT             => now(),
        ];
    }

    /**
     * State: APNs (iOS) subscription.
     */
    public function apns(): static
    {
        return $this->state(fn (): array => [
            PushSubscriptionInterface::ATTR_PROVIDER => PushProvider::Apns->value,
            PushSubscriptionInterface::ATTR_PLATFORM => PushPlatform::Ios->value,
        ]);
    }

    /**
     * State: Expo (React Native) subscription.
     */
    public function expo(): static
    {
        return $this->state(fn (): array => [
            PushSubscriptionInterface::ATTR_PROVIDER => PushProvider::Expo->value,
        ]);
    }

    /**
     * State: OneSignal subscription.
     */
    public function onesignal(): static
    {
        return $this->state(fn (): array => [
            PushSubscriptionInterface::ATTR_PROVIDER => PushProvider::OneSignal->value,
        ]);
    }

    /**
     * State: inactive (device unregistered / expired).
     */
    public function inactive(): static
    {
        return $this->state(fn (): array => [
            PushSubscriptionInterface::ATTR_IS_ACTIVE                 => false,
            PushSubscriptionInterface::ATTR_INVALID_TOKEN_REPORTED_AT => now(),
        ]);
    }
}
