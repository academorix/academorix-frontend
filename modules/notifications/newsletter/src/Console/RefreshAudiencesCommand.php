<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Academorix\Newsletter\Jobs\BuildAudienceSegmentJob;

/**
 * `php artisan newsletter:refresh-audiences` — dispatch audience
 * builder jobs for audiences whose cache has aged past the
 * refresh TTL.
 *
 * `--force` ignores the cache age and rebuilds every audience.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'newsletter:refresh-audiences',
    description: 'Refresh cached subscriber lists on newsletter audiences.',
)]
final class RefreshAudiencesCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'newsletter:refresh-audiences
        {--newsletter= : Optional newsletter id filter}
        {--force : Ignore cache age; rebuild every audience}';

    /**
     * Execute the command.
     */
    public function handle(NewsletterAudienceRepositoryInterface $audiences): int
    {
        $this->omni->titleBar('Newsletter — Refresh Audiences', 'sky');

        $force = (bool) $this->option('force');
        $maxAge = $force
            ? 0
            : (int) \config('newsletter.audience.refresh_ttl_seconds', 21600);

        $stale = $audiences->findStaleCaches($maxAge);
        $dispatched = 0;

        foreach ($stale as $audience) {
            BuildAudienceSegmentJob::dispatch((string) $audience->getKey());
            $dispatched++;
        }

        $this->omni->success(\sprintf(
            'Dispatched %d audience refresh job(s).',
            $dispatched,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
