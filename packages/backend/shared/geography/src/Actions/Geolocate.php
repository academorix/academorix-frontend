<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Services\GeolocateServiceInterface;
use Stackra\Geography\Data\GeolocationData;
use Stackra\Geography\Data\Requests\GeolocateRequestData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Request;

/**
 * `GET /api/v1/geography/geolocate` — authenticated + rate-limited
 * IP → location resolution.
 *
 * Defaults the IP to the request's source when the caller omits it.
 * Returns a `GeolocationData` payload on success; response cache
 * lives INSIDE the service (per `(ip, locale)`), NOT in the shared
 * `geography.cache` middleware.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.geolocate')]
#[Get('/api/v1/geography/geolocate')]
#[Middleware(['api', 'auth:sanctum', 'throttle:geolocate', 'world.locale'])]
#[RequirePermission(GeographyPermission::Geolocate)]
final class Geolocate
{
    use AsController;

    public function __construct(
        private readonly GeolocateServiceInterface $geolocate,
    ) {
    }

    public function __invoke(GeolocateRequestData $data, Request $request): ?GeolocationData
    {
        // Default to the request's source IP when the caller omits it.
        $ip = $data->ip !== null && $data->ip !== '' ? $data->ip : (string) $request->ip();

        return $this->geolocate->resolve($ip, $data->locale);
    }
}
