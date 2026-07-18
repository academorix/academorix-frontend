<?php

declare(strict_types=1);

namespace Academorix\Domains\Jobs;

use Academorix\Domains\Contracts\Data\DomainInterface;
use Academorix\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Academorix\Domains\Contracts\Services\CertificateProvisionerInterface;
use Academorix\Domains\Enums\SslStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Purge certificates that expired without rotation.
 *
 * Iterates every Domain with `ssl_status = issued` +
 * `ssl_expires_at < now()` and calls the provisioner's revoke path.
 * Runs weekly.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Queue('domains')]
#[Timeout(600)]
#[Tries(2)]
final class PurgeExpiredCertificatesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(
        DomainRepositoryInterface $domains,
        CertificateProvisionerInterface $provisioner,
    ): void {
        $expired = $domains->findExpiringBefore(\now());
        foreach ($expired as $domain) {
            $provisioner->revoke($domain);
            $domain->update([DomainInterface::ATTR_SSL_STATUS => SslStatus::Revoked->value]);
        }
    }

    public function failed(\Throwable $e): void
    {
    }
}
