<?php

declare(strict_types=1);

namespace Stackra\Audit\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/platform/audits/verify-chain`.
 *
 * `tenantId` is optional — omitting it verifies every tenant plus
 * every platform-plane row (tenant_id NULL) in a single walk. That's
 * the "spot-check the whole platform" surface; the tenant-scoped
 * variant is faster + cheaper on a per-run basis.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class VerifyChainRequestData extends Data
{
    /**
     * @param  string|null  $tenantId  Optional tenant id to constrain
     *   the walk to a single tenant. `ten_<ulid>` shape.
     */
    public function __construct(
        #[StringType, Max(64)]
        public ?string $tenantId = null,
    ) {
    }
}
