<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform\Countries;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Data\CountryInterface;
use Stackra\Geography\Contracts\Repositories\CountryRepositoryInterface;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\Country;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/platform/geography/countries/{country}` — platform
 * admin archives a country row (soft delete via `status = 0`).
 *
 * Downstream FK integrity is preserved by the observer's deleting
 * hook when a hard-delete is attempted; this action archives instead.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.countries.delete')]
#[Delete('/api/v1/platform/geography/countries/{country}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class DeleteCountry
{
    use AsController;

    public function __construct(
        private readonly CountryRepositoryInterface $countries,
    ) {
    }

    public function __invoke(Country $country): JsonResponse
    {
        // Soft-archive rather than hard-delete — downstream FK
        // integrity is preserved and rows come back easily on
        // status = 1.
        $this->countries->update((string) $country->getKey(), [
            CountryInterface::ATTR_STATUS => 0,
        ]);

        return \response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }
}
