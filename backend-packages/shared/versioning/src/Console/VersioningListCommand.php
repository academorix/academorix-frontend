<?php

declare(strict_types=1);

namespace Academorix\Versioning\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Versioning\Contracts\Data\ApiVersionInterface;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;

/**
 * `php artisan versioning:list` — table view of every registered
 * ApiVersion + its status. Useful for platform-admin diagnostics.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'versioning:list',
    description: 'List every registered API version and its status.',
)]
final class VersioningListCommand extends BaseCommand
{
    public function handle(ApiVersionRepositoryInterface $versions): int
    {
        $this->omni->titleBar('API Versions', 'sky');

        $rows = $versions->paginate(1000)->getCollection();
        if ($rows->isEmpty()) {
            $this->omni->info('No API versions registered yet.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Slug', 'Scheme', 'Value', 'Status', 'Released', 'Sunset');
        foreach ($rows as $row) {
            $released = $row->{ApiVersionInterface::ATTR_RELEASED_AT};
            $sunset   = $row->{ApiVersionInterface::ATTR_SUNSET_AT};
            $this->omni->tableRow(
                (string) $row->{ApiVersionInterface::ATTR_SLUG},
                (string) $row->{ApiVersionInterface::ATTR_SCHEME},
                (string) $row->{ApiVersionInterface::ATTR_SCHEME_VALUE},
                (string) $row->{ApiVersionInterface::ATTR_STATUS},
                $released === null ? '-' : $released->toDateString(),
                $sunset === null ? '-' : $sunset->toDateString(),
            );
        }

        $this->omni->success(\sprintf('%d version(s).', $rows->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
