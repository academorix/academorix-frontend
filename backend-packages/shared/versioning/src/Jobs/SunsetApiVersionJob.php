<?php

declare(strict_types=1);

namespace Academorix\Versioning\Jobs;

use Academorix\Versioning\Contracts\Data\ApiVersionInterface;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Enums\ApiVersionStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Flip an ApiVersion from `deprecated` to `sunset`.
 *
 * Dispatched by the platform-admin sunset action + by the scheduled
 * scan that watches `(status = deprecated AND sunset_at < now())`.
 * The observer on the model emits {@see \Academorix\Versioning\Events\ApiVersionSunset}
 * once the update commits.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Queue('default')]
#[Timeout(60)]
#[Tries(3)]
final class SunsetApiVersionJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $apiVersionId)
    {
    }

    /**
     * Perform the transition. Idempotent — a row already in `sunset`
     * is skipped.
     */
    public function handle(ApiVersionRepositoryInterface $versions): void
    {
        $version = $versions->find($this->apiVersionId);
        if ($version === null) {
            return;
        }

        $status = $version->{ApiVersionInterface::ATTR_STATUS};
        if ($status === ApiVersionStatus::Sunset || $status === ApiVersionStatus::Sunset->value) {
            return;
        }

        $version->update([
            ApiVersionInterface::ATTR_STATUS    => ApiVersionStatus::Sunset->value,
            ApiVersionInterface::ATTR_SUNSET_AT => $version->{ApiVersionInterface::ATTR_SUNSET_AT}
                ?? \now(),
        ]);
    }

    /**
     * The queue exhausted its retry budget — log intent for later
     * observability wiring.
     */
    public function failed(\Throwable $e): void
    {
    }
}
