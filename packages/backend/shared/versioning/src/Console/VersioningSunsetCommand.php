<?php

declare(strict_types=1);

namespace Academorix\Versioning\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Jobs\SunsetApiVersionJob;

/**
 * `php artisan versioning:sunset {slug}` — dispatch
 * {@see SunsetApiVersionJob} to transition an ApiVersion from
 * `deprecated` to `sunset`. Runs asynchronously so downstream
 * consumers (webhook subscription unpin, notification fanout) don't
 * block the CLI thread.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'versioning:sunset',
    description: 'Dispatch the sunset job for an API version.',
)]
final class VersioningSunsetCommand extends BaseCommand
{
    protected $signature = 'versioning:sunset {slug : The version slug to sunset}';

    public function handle(ApiVersionRepositoryInterface $versions): int
    {
        $slug = (string) $this->argument('slug');

        $this->omni->titleBar(\sprintf('Sunset %s', $slug), 'rose');

        $version = $versions->findBySlug($slug);
        if ($version === null) {
            $this->omni->error(\sprintf('No API version with slug "%s".', $slug));
            $this->showDuration();

            return self::FAILURE;
        }

        SunsetApiVersionJob::dispatch((string) $version->getKey());

        $this->omni->success(\sprintf('Sunset job dispatched for %s.', $slug));
        $this->showDuration();

        return self::SUCCESS;
    }
}
