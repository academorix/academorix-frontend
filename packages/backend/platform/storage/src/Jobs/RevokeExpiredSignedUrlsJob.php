<?php

declare(strict_types=1);

namespace Academorix\Storage\Jobs;

use Academorix\Storage\Contracts\Data\SignedUrlAuditInterface;
use Academorix\Storage\Contracts\Repositories\SignedUrlAuditRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Sweep every expired {@see \Academorix\Storage\Models\SignedUrlAudit}
 * row that has NOT been revoked yet — flip `revoked_at` +
 * `revoked_reason = expired_by_sweep`.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Queue('default')]
#[Timeout(300)]
#[Tries(2)]
final class RevokeExpiredSignedUrlsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(SignedUrlAuditRepositoryInterface $audits): void
    {
        $now = \Carbon\CarbonImmutable::now();

        foreach ($audits->findExpiredUnrevoked($now) as $audit) {
            $audit->update([
                SignedUrlAuditInterface::ATTR_REVOKED_AT     => $now,
                SignedUrlAuditInterface::ATTR_REVOKED_REASON => 'expired_by_sweep',
            ]);
        }
    }

    public function failed(\Throwable $e): void
    {
    }
}
