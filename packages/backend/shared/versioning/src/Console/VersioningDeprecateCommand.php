<?php

declare(strict_types=1);

namespace Stackra\Versioning\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Versioning\Contracts\Data\ApiVersionInterface;
use Stackra\Versioning\Contracts\Data\DeprecationNoticeInterface;
use Stackra\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Stackra\Versioning\Contracts\Repositories\DeprecationNoticeRepositoryInterface;
use Stackra\Versioning\Enums\ApiVersionStatus;
use Stackra\Versioning\Enums\DeprecationSurface;

/**
 * `php artisan versioning:deprecate {slug}` — transition an
 * ApiVersion from `released` to `deprecated` and create an active
 * deprecation notice.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'versioning:deprecate',
    description: 'Transition an API version to deprecated and publish a notice.',
)]
final class VersioningDeprecateCommand extends BaseCommand
{
    protected $signature = 'versioning:deprecate {slug : The version slug to deprecate}';

    public function handle(
        ApiVersionRepositoryInterface $versions,
        DeprecationNoticeRepositoryInterface $notices,
    ): int {
        $slug = (string) $this->argument('slug');

        $this->omni->titleBar(\sprintf('Deprecate %s', $slug), 'amber');

        $version = $versions->findBySlug($slug);
        if ($version === null) {
            $this->omni->error(\sprintf('No API version with slug "%s".', $slug));
            $this->showDuration();

            return self::FAILURE;
        }

        $noticeDays = (int) \config('versioning.sunset.default_notice_days', 180);

        $version->update([
            ApiVersionInterface::ATTR_STATUS        => ApiVersionStatus::Deprecated->value,
            ApiVersionInterface::ATTR_DEPRECATED_AT => $version->{ApiVersionInterface::ATTR_DEPRECATED_AT}
                ?? \now(),
            ApiVersionInterface::ATTR_SUNSET_AT => $version->{ApiVersionInterface::ATTR_SUNSET_AT}
                ?? \now()->addDays($noticeDays),
        ]);

        // Emit a companion deprecation notice so tenants see a public trail.
        $notices->create([
            DeprecationNoticeInterface::ATTR_API_VERSION_ID => (string) $version->getKey(),
            DeprecationNoticeInterface::ATTR_SURFACE        => DeprecationSurface::All->value,
            DeprecationNoticeInterface::ATTR_TITLE          => \sprintf('%s deprecated', $slug),
            DeprecationNoticeInterface::ATTR_BODY           => \sprintf(
                'API version %s is deprecated. Sunset scheduled for %s.',
                $slug,
                $version->{ApiVersionInterface::ATTR_SUNSET_AT}?->toDateString() ?? 'TBD',
            ),
            DeprecationNoticeInterface::ATTR_IS_ACTIVE => true,
        ]);

        $this->omni->success(\sprintf('Deprecated %s + published notice.', $slug));
        $this->showDuration();

        return self::SUCCESS;
    }
}
