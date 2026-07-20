<?php

declare(strict_types=1);

namespace Academorix\Versioning\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Versioning\Contracts\Data\ApiVersionInterface;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Enums\ApiVersionStatus;

/**
 * `php artisan versioning:release {slug}` — transition an ApiVersion
 * from `draft` to `released`.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'versioning:release',
    description: 'Transition an API version from draft to released.',
)]
final class VersioningReleaseCommand extends BaseCommand
{
    protected $signature = 'versioning:release {slug : The version slug to release}';

    public function handle(ApiVersionRepositoryInterface $versions): int
    {
        $slug = (string) $this->argument('slug');

        $this->omni->titleBar(\sprintf('Release %s', $slug), 'sky');

        $version = $versions->findBySlug($slug);
        if ($version === null) {
            $this->omni->error(\sprintf('No API version with slug "%s".', $slug));
            $this->showDuration();

            return self::FAILURE;
        }

        $version->update([
            ApiVersionInterface::ATTR_STATUS      => ApiVersionStatus::Released->value,
            ApiVersionInterface::ATTR_RELEASED_AT => $version->{ApiVersionInterface::ATTR_RELEASED_AT}
                ?? \now(),
        ]);

        $this->omni->success(\sprintf('Released %s.', $slug));
        $this->showDuration();

        return self::SUCCESS;
    }
}
