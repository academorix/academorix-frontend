<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Registry\TranslatorDriverRegistryInterface;
use Stackra\Localization\Data\Resources\TranslatorDriverStatusData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/translation-drivers/status` — per-driver
 * reachability + configuration report.
 *
 * Powers the platform-admin dashboard tile that surfaces which
 * driver is healthy + which is misconfigured.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.platform.drivers.status')]
#[Get('/api/v1/platform/translation-drivers/status')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(LocalizationPermission::PlatformTranslationsViewAny)]
final class DriverStatus
{
    use AsController;

    public function __construct(
        private readonly TranslatorDriverRegistryInterface $registry,
    ) {
    }

    /**
     * @return DataCollection<int, TranslatorDriverStatusData>
     */
    public function __invoke(): DataCollection
    {
        $rows = [];
        foreach ($this->registry->names() as $name) {
            $driver = $this->registry->resolve($name);
            $health = $driver->healthcheck();

            $rows[] = new TranslatorDriverStatusData(
                name: $name,
                configured: $health->reachable || $health->errorMessage !== null,
                reachable: $health->reachable,
                latencyMs: $health->latencyMs,
                errorMessage: $health->errorMessage,
            );
        }

        return new DataCollection(TranslatorDriverStatusData::class, $rows);
    }
}
