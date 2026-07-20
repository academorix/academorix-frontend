<?php

declare(strict_types=1);

namespace Academorix\Domains\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Academorix\Domains\Jobs\RotateCertificateJob;
use Carbon\CarbonImmutable;

/**
 * `php artisan domains:rotate-certificates` — dispatch rotation for
 * every certificate expiring within the given window (default 30 days).
 *
 * Runs daily via the scheduler.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'domains:rotate-certificates',
    description: 'Rotate certificates expiring within the window.',
)]
final class DomainsRotateCertificatesCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'domains:rotate-certificates
        {--days=30 : Rotation window in days}
        {--dry-run : List eligible domains without dispatching}';

    public function handle(DomainRepositoryInterface $domains): int
    {
        $this->omni->titleBar('Rotate Certificates', 'amber');

        $days   = (int) $this->option('days');
        $cutoff = CarbonImmutable::now()->addDays($days);
        $rows   = $domains->findExpiringBefore($cutoff);

        if ($rows->isEmpty()) {
            $this->omni->info(\sprintf('No certificates expiring within %d days.', $days));
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Domain ID', 'Host', 'Expires At');

        $dryRun = $this->option('dry-run') === true;
        $count  = 0;

        foreach ($rows as $domain) {
            $this->omni->tableRow(
                (string) $domain->getKey(),
                (string) $domain->host,
                (string) $domain->ssl_expires_at,
            );

            if ($dryRun) {
                continue;
            }

            RotateCertificateJob::dispatch((string) $domain->getKey());
            $count++;
        }

        $this->omni->success(\sprintf(
            $dryRun ? 'Would rotate %d certificate(s).' : 'Dispatched %d RotateCertificateJob(s).',
            $dryRun ? $rows->count() : $count,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
