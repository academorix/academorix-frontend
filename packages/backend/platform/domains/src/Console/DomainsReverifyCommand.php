<?php

declare(strict_types=1);

namespace Stackra\Domains\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Domains\Contracts\Data\DomainInterface;
use Stackra\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Stackra\Domains\Jobs\VerifyDomainDnsJob;
use Carbon\CarbonImmutable;

/**
 * `php artisan domains:reverify` — reschedule verification for domains
 * whose last check is stale.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'domains:reverify',
    description: 'Reschedule verification for stale domains.',
)]
final class DomainsReverifyCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'domains:reverify
        {--stale-hours=24 : Only reverify domains whose last check is older than N hours}
        {--tenant= : Limit to a single tenant id or slug}';

    public function handle(DomainRepositoryInterface $domains): int
    {
        $this->omni->titleBar('Reverify Domains', 'sky');

        $staleHours = (int) $this->option('stale-hours');
        $cutoff     = CarbonImmutable::now()->subHours($staleHours);

        $q = $domains->query()
            ->whereNull(DomainInterface::ATTR_VERIFIED_AT)
            ->where(function ($q) use ($cutoff): void {
                $q->whereNull(DomainInterface::ATTR_UPDATED_AT)
                    ->orWhere(DomainInterface::ATTR_UPDATED_AT, '<', $cutoff);
            });

        if (($tenant = $this->option('tenant')) !== null && $tenant !== '') {
            $q->where(DomainInterface::ATTR_TENANT_ID, $tenant);
        }

        $rows = $q->get();

        if ($rows->isEmpty()) {
            $this->omni->info('No stale domains found.');
            $this->showDuration();

            return self::SUCCESS;
        }

        foreach ($rows as $domain) {
            VerifyDomainDnsJob::dispatch((string) $domain->getKey());
        }

        $this->omni->success(\sprintf('Dispatched %d VerifyDomainDnsJob(s).', $rows->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
