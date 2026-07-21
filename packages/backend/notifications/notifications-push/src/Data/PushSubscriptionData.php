<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Data;

use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Stackra\Notifications\Push\Enums\PushPlatform;
use Stackra\Notifications\Push\Enums\PushProvider;
use Stackra\Notifications\Push\Models\PushSubscription;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for a {@see PushSubscription}.
 *
 * `device_token` is deliberately omitted — RESTRICTED tier field, NEVER
 * returned on any API response. Admins see the fingerprint instead.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class PushSubscriptionData extends Data
{
    /**
     * @param  string                    $id                       `psub_<ulid>`.
     * @param  string                    $tenantId                 Owning tenant.
     * @param  string                    $applicationId            Owning Application.
     * @param  string                    $userId                   Owner User.
     * @param  PushProvider              $provider                 Push provider driver.
     * @param  PushPlatform              $platform                 Target device platform.
     * @param  string                    $deviceTokenFingerprint   SHA-256 of the plaintext token — safe to return.
     * @param  string|null               $deviceName               Admin-visible device label.
     * @param  string|null               $appVersion               Registered app version.
     * @param  string|null               $osVersion                Registered OS version.
     * @param  string|null               $locale                   User's active locale.
     * @param  bool                      $isActive                 Whether the row is still eligible for delivery.
     * @param  \DateTimeInterface        $createdAt                Row creation.
     * @param  \DateTimeInterface        $updatedAt                Last mutation.
     * @param  \DateTimeInterface|null   $lastSeenAt               Last time the client refreshed the token.
     * @param  \DateTimeInterface|null   $expiresAt                When the subscription was declared expired.
     * @param  \DateTimeInterface|null   $invalidTokenReportedAt   When the provider first reported the token invalid.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $applicationId,
        public string $userId,
        public PushProvider $provider,
        public PushPlatform $platform,
        public string $deviceTokenFingerprint,
        public ?string $deviceName,
        public ?string $appVersion,
        public ?string $osVersion,
        public ?string $locale,
        public bool $isActive,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastSeenAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $expiresAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $invalidTokenReportedAt = null,
    ) {
    }

    /**
     * Build from a model.
     */
    public static function fromModel(PushSubscription $subscription): self
    {
        $providerValue = $subscription->{PushSubscriptionInterface::ATTR_PROVIDER};
        $provider = $providerValue instanceof PushProvider
            ? $providerValue
            : (PushProvider::tryFrom((string) $providerValue) ?? PushProvider::Fcm);

        $platformValue = $subscription->{PushSubscriptionInterface::ATTR_PLATFORM};
        $platform = $platformValue instanceof PushPlatform
            ? $platformValue
            : (PushPlatform::tryFrom((string) $platformValue) ?? PushPlatform::Other);

        return new self(
            id: (string) $subscription->getKey(),
            tenantId: (string) $subscription->{PushSubscriptionInterface::ATTR_TENANT_ID},
            applicationId: (string) $subscription->{PushSubscriptionInterface::ATTR_APPLICATION_ID},
            userId: (string) $subscription->{PushSubscriptionInterface::ATTR_USER_ID},
            provider: $provider,
            platform: $platform,
            deviceTokenFingerprint: (string) $subscription->{PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT},
            deviceName: $subscription->{PushSubscriptionInterface::ATTR_DEVICE_NAME},
            appVersion: $subscription->{PushSubscriptionInterface::ATTR_APP_VERSION},
            osVersion: $subscription->{PushSubscriptionInterface::ATTR_OS_VERSION},
            locale: $subscription->{PushSubscriptionInterface::ATTR_LOCALE},
            isActive: (bool) $subscription->{PushSubscriptionInterface::ATTR_IS_ACTIVE},
            createdAt: $subscription->{PushSubscriptionInterface::ATTR_CREATED_AT},
            updatedAt: $subscription->{PushSubscriptionInterface::ATTR_UPDATED_AT},
            lastSeenAt: $subscription->{PushSubscriptionInterface::ATTR_LAST_SEEN_AT},
            expiresAt: $subscription->{PushSubscriptionInterface::ATTR_EXPIRES_AT},
            invalidTokenReportedAt: $subscription->{PushSubscriptionInterface::ATTR_INVALID_TOKEN_REPORTED_AT},
        );
    }
}
