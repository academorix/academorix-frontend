<?php

declare(strict_types=1);

namespace Academorix\Tax\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Verdict of an exemption validation.
 *
 * `valid = true` means the exemption applies and taxes should be
 * zeroed. `valid = false` means the caller must proceed with
 * standard tax calc; `reason` explains why the exemption did not
 * apply (log surface, operator UI, dispute API).
 *
 * @category Tax
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class ExemptionVerdictData extends Data
{
    /**
     * @param  bool         $valid   True when the exemption applies at this date + jurisdiction.
     * @param  string|null  $reason  Machine-readable reason when invalid (`expired`, `wrong_jurisdiction`,
     *                               `revoked`, `pending_review`, `not_found`).
     */
    public function __construct(
        public bool $valid,
        public ?string $reason = null,
    ) {
    }
}
