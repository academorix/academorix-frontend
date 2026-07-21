<?php

declare(strict_types=1);

namespace Stackra\Subscription\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Date;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/platform/subscriptions/{tenant}/enterprise-invoice`.
 *
 * Creates a `billing_mode=invoice` subscription without Cashier.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class EnterpriseInvoiceRequestData extends Data
{
    /**
     * @param  string       $planId          Target plan ULID (must be billing_mode=invoice).
     * @param  string       $invoiceNumber   External PO reference.
     * @param  string       $dueDate         ISO-8601 date the invoice is due.
     * @param  string|null  $notes           Optional operator note (retained on the event).
     */
    public function __construct(
        #[Required, StringType, Max(64)]
        public string $planId,

        #[Required, StringType, Max(64)]
        public string $invoiceNumber,

        #[Required, Date]
        public string $dueDate,

        #[StringType, Max(500)]
        public ?string $notes = null,
    ) {
    }
}
