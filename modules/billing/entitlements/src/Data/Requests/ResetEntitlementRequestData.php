<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/platform/entitlements/{tenant}/reset/{key}` — platform
 * admin manually resets a pool-kind entitlement's period counter.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ResetEntitlementRequestData extends Data
{
    public function __construct(
        #[StringType, Max(500)]
        public ?string $reason = null,
    ) {
    }
}
