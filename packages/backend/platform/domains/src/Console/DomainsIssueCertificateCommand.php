<?php

declare(strict_types=1);

namespace Stackra\Domains\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Domains\Contracts\Data\DomainInterface;
use Stackra\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Stackra\Domains\Jobs\IssueCertificateJob;

/**
 * `php artisan domains:issue-certificate` — dispatch an issue job for
 * a single Domain by id or host.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'domains:issue-certificate',
    description: 'Dispatch IssueCertificateJob for a single Domain.',
)]
final class DomainsIssueCertificateCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'domains:issue-certificate {domain : Domain id (dom_...) or host}';

    public function handle(DomainRepositoryInterface $domains): int
    {
        $this->omni->titleBar('Issue Certificate', 'sky');

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

        IssueCertificateJob::dispatch((string) $domain->getKey());

        $this->omni->success(\sprintf('Dispatched IssueCertificateJob for %s.', $domain->host));
        $this->showDuration();

        return self::SUCCESS;
    }
}
