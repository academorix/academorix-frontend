<?php

declare(strict_types=1);

namespace Stackra\Domains\Jobs;

use Stackra\Domains\Contracts\Data\DomainInterface;
use Stackra\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Stackra\Domains\Contracts\Services\CertificateProvisionerInterface;
use Stackra\Domains\Events\CertificateIssued;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Issue a certificate for a verified Domain.
 *
 * Delegates to the bound {@see CertificateProvisionerInterface} —
 * the default `NullCertificateProvisioner` returns `pending`. Consumer
 * apps bind a real provisioner.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Queue('certificates')]
#[Timeout(300)]
#[Tries(5)]
#[Backoff(60, 300, 900, 1800, 3600)]
final class IssueCertificateJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $domainId)
    {
    }

    public function handle(
        DomainRepositoryInterface $domains,
        CertificateProvisionerInterface $provisioner,
    ): void {
        $domain = $domains->find($this->domainId);
        if ($domain === null || ! $domain->isVerified()) {
            return;
        }

        $result = $provisioner->issue($domain);

        $domain->update([
            DomainInterface::ATTR_SSL_STATUS      => $result['ssl_status'],
            DomainInterface::ATTR_SSL_ISSUED_AT   => $result['ssl_issued_at'],
            DomainInterface::ATTR_SSL_EXPIRES_AT  => $result['ssl_expires_at'],
        ]);

        if ($result['ssl_status'] === 'issued') {
            CertificateIssued::dispatch($domain);
        }
    }

    public function failed(\Throwable $e): void
    {
    }
}
