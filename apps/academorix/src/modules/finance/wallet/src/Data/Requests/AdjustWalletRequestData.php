<?php

declare(strict_types=1);

namespace Stackra\Wallet\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/wallets/{wallet}/adjust`.
 *
 * Admin adjustments are ledger corrections — every write becomes an
 * immutable `wallet_transactions` row of kind `adjustment`. Positive
 * `amount_minor` credits the wallet; negative debits.
 *
 * @category Wallet
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AdjustWalletRequestData extends Data
{
    /**
     * @param  int         $amountMinor  Signed integer amount in minor units
     *                                   (positive = credit, negative = debit).
     * @param  string      $reason       Admin-provided reason (audit trail).
     * @param  string|null $sourceType   Optional pointer to the correcting
     *                                   entity (e.g. `refund`, `chargeback`).
     * @param  string|null $sourceId     Optional pointer id.
     */
    public function __construct(
        #[Required]
        public int $amountMinor,

        #[Required, StringType, Max(500)]
        public string $reason,

        #[StringType, Max(64), In(['adjustment', 'correction', 'refund', 'chargeback', 'promo', 'goodwill'])]
        public ?string $sourceType = 'adjustment',

        #[StringType, Max(64)]
        public ?string $sourceId = null,
    ) {
    }
}
