<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Data;

use Stackra\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Stackra\Notifications\Sms\Enums\SmsOptOutReason;
use Stackra\Notifications\Sms\Enums\SmsProvider;
use Stackra\Notifications\Sms\Models\SmsOptOut;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for a {@see SmsOptOut}.
 *
 * `inbound_message_body` is omitted — CONFIDENTIAL tier (may contain PII the
 * user typed in the STOP reply).
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SmsOptOutData extends Data
{
    /**
     * @param  string                    $id                 `sopt_<ulid>`.
     * @param  string|null               $tenantId           Owning tenant (nullable = platform-wide).
     * @param  string                    $phone              E.164 phone number.
     * @param  string                    $phoneCountryCode   ISO 3166-1 alpha-2.
     * @param  SmsOptOutReason           $reason             Why the row exists.
     * @param  SmsProvider|null          $provider           Provider that reported the opt-out (if any).
     * @param  bool                      $isSystem           Whether this is a platform-managed row.
     * @param  \DateTimeInterface        $optedOutAt         When the opt-out took effect.
     * @param  \DateTimeInterface        $createdAt          Row creation.
     * @param  \DateTimeInterface        $updatedAt          Last mutation.
     * @param  \DateTimeInterface|null   $expiresAt          Auto-expiry (e.g. 30d recheck for invalid_number).
     */
    public function __construct(
        public string $id,
        public ?string $tenantId,
        public string $phone,
        public string $phoneCountryCode,
        public SmsOptOutReason $reason,
        public ?SmsProvider $provider,
        public bool $isSystem,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $optedOutAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $expiresAt = null,
    ) {
    }

    /**
     * Build from a model.
     */
    public static function fromModel(SmsOptOut $optOut): self
    {
        $reasonValue = $optOut->{SmsOptOutInterface::ATTR_REASON};
        $reason = $reasonValue instanceof SmsOptOutReason
            ? $reasonValue
            : (SmsOptOutReason::tryFrom((string) $reasonValue) ?? SmsOptOutReason::Admin);

        $providerValue = $optOut->{SmsOptOutInterface::ATTR_PROVIDER};
        $provider = $providerValue instanceof SmsProvider
            ? $providerValue
            : ($providerValue === null ? null : SmsProvider::tryFrom((string) $providerValue));

        return new self(
            id: (string) $optOut->getKey(),
            tenantId: $optOut->{SmsOptOutInterface::ATTR_TENANT_ID},
            phone: (string) $optOut->{SmsOptOutInterface::ATTR_PHONE},
            phoneCountryCode: (string) $optOut->{SmsOptOutInterface::ATTR_PHONE_COUNTRY_CODE},
            reason: $reason,
            provider: $provider,
            isSystem: (bool) $optOut->{SmsOptOutInterface::ATTR_IS_SYSTEM},
            optedOutAt: $optOut->{SmsOptOutInterface::ATTR_OPTED_OUT_AT},
            createdAt: $optOut->{SmsOptOutInterface::ATTR_CREATED_AT},
            updatedAt: $optOut->{SmsOptOutInterface::ATTR_UPDATED_AT},
            expiresAt: $optOut->{SmsOptOutInterface::ATTR_EXPIRES_AT},
        );
    }
}
