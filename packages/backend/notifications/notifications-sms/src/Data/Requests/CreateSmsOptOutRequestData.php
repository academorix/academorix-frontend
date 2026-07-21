<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Data\Requests;

use Stackra\Notifications\Sms\Enums\SmsOptOutReason;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/tenant/sms-opt-outs`.
 *
 * Tenant admins manually add opt-outs. Phone MUST be E.164
 * (`+[country][subscriber]`). Country code is derived server-side.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateSmsOptOutRequestData extends Data
{
    /**
     * @param  string           $phone   E.164 phone number.
     * @param  SmsOptOutReason  $reason  Why the row is being created. Defaults to Admin.
     */
    public function __construct(
        #[Required, StringType, Min(8), Max(32), Regex('/^\+[1-9]\d{6,14}$/')]
        public string $phone,

        #[Enum(SmsOptOutReason::class)]
        public SmsOptOutReason $reason = SmsOptOutReason::Admin,
    ) {
    }
}
