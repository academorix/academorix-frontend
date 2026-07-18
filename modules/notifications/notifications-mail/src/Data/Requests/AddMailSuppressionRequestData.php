<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Data\Requests;

use Academorix\Notifications\Mail\Enums\MailSuppressionReason;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for
 * `POST /api/v1/tenant/mail-suppressions`.
 *
 * Only `email` is required — everything else defaults. `reason`
 * defaults to `manual` because this endpoint is the tenant-admin
 * "block an address" surface; every other reason is landed by the
 * webhook / preference / seeder paths, not by this action.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AddMailSuppressionRequestData extends Data
{
    /**
     * @param  string       $email          Address to block. Normalised (lowered) on save.
     * @param  string       $reason         Blocking reason — always `manual` from this endpoint.
     * @param  string|null  $bounceReason   Optional admin note recorded on the row.
     */
    public function __construct(
        #[Required, Email, Max(254)]
        public string $email,

        #[Required, StringType, Enum(MailSuppressionReason::class)]
        public string $reason = 'manual',

        #[StringType, Max(500)]
        public ?string $bounceReason = null,
    ) {
    }
}
