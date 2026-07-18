<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/platform/tenants/{tenant}/suspend`.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class SuspendTenantRequestData extends Data
{
    /**
     * @param  string  $reason  Free-form reason recorded in the audit trail.
     */
    public function __construct(
        #[Required, StringType, Max(500)]
        public string $reason,
    ) {
    }
}
