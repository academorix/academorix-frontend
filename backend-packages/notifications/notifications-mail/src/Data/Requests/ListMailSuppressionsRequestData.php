<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Data\Requests;

use Academorix\Notifications\Mail\Enums\MailProvider;
use Academorix\Notifications\Mail\Enums\MailSuppressionReason;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated query payload for `GET /api/v1/tenant/mail-suppressions`.
 *
 * Every filter is optional. Reason + provider filters accept the
 * enum backing values only.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ListMailSuppressionsRequestData extends Data
{
    /**
     * @param  string|null  $reason        `MailSuppressionReason` backing value.
     * @param  string|null  $provider      `MailProvider` backing value.
     * @param  string|null  $emailDomain   Exact match on `email_domain`.
     * @param  bool|null    $isSystem      Filter to platform-wide (`true`) or tenant (`false`) rows.
     */
    public function __construct(
        #[StringType, Enum(MailSuppressionReason::class)]
        public ?string $reason = null,

        #[StringType, Enum(MailProvider::class)]
        public ?string $provider = null,

        #[StringType, Max(253)]
        public ?string $emailDomain = null,

        #[BooleanType]
        public ?bool $isSystem = null,
    ) {
    }
}
