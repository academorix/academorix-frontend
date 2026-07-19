<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `PATCH /api/v1/platform/entitlements/{tenant}/{key}` — platform
 * admin overrides an entitlement's cap.
 *
 * The full `value` payload is passed by the caller; the observer
 * fires `EntitlementOverridden` with an accurate old → new diff.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateEntitlementRequestData extends Data
{
    /**
     * @param  array<string, mixed>  $value  Kind-dependent shape.
     */
    public function __construct(
        #[Required]
        public array $value,

        #[StringType, Max(500)]
        public ?string $notes = null,
    ) {
    }
}
