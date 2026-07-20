<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Data\Requests;

use Academorix\Notifications\Push\Enums\PushPlatform;
use Academorix\Notifications\Push\Enums\PushProvider;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/tenant/notification-subscriptions`.
 *
 * The action fills `tenant_id` + `application_id` + `user_id` from the resolved
 * context — the caller submits only the device-specific fields.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class RegisterPushSubscriptionRequestData extends Data
{
    /**
     * @param  PushProvider  $provider     Push provider — matches the client SDK.
     * @param  PushPlatform  $platform     Target device platform.
     * @param  string        $deviceToken  Provider-issued device token (encrypted at rest).
     * @param  string|null   $deviceName   Human-readable label ("Alex's iPhone").
     * @param  string|null   $appVersion   App version at register time.
     * @param  string|null   $osVersion    OS version at register time.
     * @param  string|null   $locale       User's active locale.
     * @param  string|null   $timezone     IANA timezone identifier.
     */
    public function __construct(
        #[Required, Enum(PushProvider::class)]
        public PushProvider $provider,

        #[Required, Enum(PushPlatform::class)]
        public PushPlatform $platform,

        #[Required, StringType, Min(8), Max(2000)]
        public string $deviceToken,

        #[StringType, Max(200)]
        public ?string $deviceName = null,

        #[StringType, Max(32)]
        public ?string $appVersion = null,

        #[StringType, Max(32)]
        public ?string $osVersion = null,

        #[StringType, Max(16)]
        public ?string $locale = null,

        #[StringType, Max(64)]
        public ?string $timezone = null,
    ) {
    }
}
