<?php

declare(strict_types=1);

namespace Academorix\Domains\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Domains\Contracts\Data\DomainInterface;
use Academorix\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Academorix\Domains\Jobs\VerifyDomainDnsJob;

/**
 * `php artisan domains:verify` — dispatch a verify job for a single
 * Domain by id or host.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'domains:verify',
    description: 'Dispatch VerifyDomainDnsJob for a single Domain.',
)]
final class DomainsVerifyCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'domains:verify {domain : Domain id (dom_...) or host}';

    public function handle(DomainRepositoryInterface $domains): int
    {
        $this->omni->titleBar('Verify Domain', 'sky');

        $identifier = (string) $this->argument('domain');

        $domain = $domains->query()
            ->where(function ($q) use ($identifier): void {
                $q->where(DomainInterface::ATTR_ID, $identifier)
                    ->orWhere(DomainInterface::ATTR_HOST, $identifier);
            })
            ->first();

        if ($domain === null) {
            $this->omni->error(\sprintf('Domain "%s" not found.', $identifier));
            $this->showDuration();

            return self::FAILURE;
        }

        VerifyDomainDnsJob::dispatch((string) $domain->getKey());

        $this->omni->success(\sprintf('Dispatched VerifyDomainDnsJob for %s.', $domain->host));
        $this->showDuration();

        return self::SUCCESS;
    }
}
