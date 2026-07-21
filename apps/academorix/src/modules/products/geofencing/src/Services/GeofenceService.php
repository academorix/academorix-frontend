<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Services;

use Academorix\Geofencing\Contracts\Data\GeofenceCheckInterface;
use Academorix\Geofencing\Contracts\Geofenceable;
use Academorix\Geofencing\Contracts\Repositories\GeofenceCheckRepositoryInterface;
use Academorix\Geofencing\Contracts\Services\GeofenceServiceInterface;
use Academorix\Geofencing\Contracts\Services\PolygonEvaluatorInterface;
use Academorix\Geofencing\Data\EvaluateGeofenceData;
use Academorix\Geofencing\Data\GeofenceCheckResultData;
use Academorix\Geofencing\Enums\GeofenceMode;
use Academorix\Geofencing\Enums\GeofenceResult;
use Academorix\Geofencing\Events\GeofenceEvaluated;
use Academorix\Geofencing\Exceptions\FenceableNoGeometryException;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Throwable;

/**
 * Default implementation of {@see GeofenceServiceInterface}.
 *
 * ## Decision tree (design §4)
 *
 *   1. Accuracy tolerance short-circuit — `accuracyM > tolerance` → `SKIPPED`.
 *   2. Polygon branch — if fenceable has `geofencePolygon()`: point-in-polygon
 *      via `PolygonEvaluator`.
 *   3. Radius fallback — otherwise: haversine against `locationPoint()`
 *      compared to `geofenceRadiusM()`.
 *   4. Fail-closed on missing geometry: `ERROR`.
 *
 * `#[Scoped]` — reads the tenant context on every request, so the request
 * lifetime is the right scope. Framework services (`#[Config]`) are injected
 * once and shared across the request.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Scoped]
final class GeofenceService implements GeofenceServiceInterface
{
    public function __construct(
        private readonly GeofenceCheckRepositoryInterface $repository,
        private readonly PolygonEvaluatorInterface $polygonEvaluator,
        private readonly TenantContextInterface $tenantContext,
        #[Config('geofencing.evaluator.default_accuracy_tolerance_m')]
        private readonly int $defaultAccuracyToleranceM,
        #[Config('geofencing.evaluator.default_radius_m')]
        private readonly int $defaultRadiusM,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function evaluate(Geofenceable $fenceable, EvaluateGeofenceData $input): GeofenceCheckResultData
    {
        [$result, $mode, $distance] = $this->run($fenceable, $input);

        $tenant   = $this->tenantContext->currentOrFail();
        $tenantId = (string) $tenant->getKey();

        $check = $this->repository->create([
            GeofenceCheckInterface::ATTR_TENANT_ID           => $tenantId,
            GeofenceCheckInterface::ATTR_FENCEABLE_TYPE      => $input->fenceableType,
            GeofenceCheckInterface::ATTR_FENCEABLE_ID        => $input->fenceableId,
            GeofenceCheckInterface::ATTR_SUBJECT_TYPE        => $input->subjectType,
            GeofenceCheckInterface::ATTR_SUBJECT_ID          => $input->subjectId,
            GeofenceCheckInterface::ATTR_RESULT              => $result->value,
            GeofenceCheckInterface::ATTR_MODE                => $mode->value,
            GeofenceCheckInterface::ATTR_CAPTURED_LOCATION   => \sprintf('POINT(%f %f)', $input->lng, $input->lat),
            GeofenceCheckInterface::ATTR_ACCURACY_M          => $input->accuracyM,
            GeofenceCheckInterface::ATTR_DISTANCE_TO_FENCE_M => $distance,
            GeofenceCheckInterface::ATTR_EVALUATED_AT        => now(),
        ]);

        // Fire the evaluation event synchronously so subject-side listeners
        // (staff-clock-in, attendance) can stamp the check id on their own
        // row before the request returns.
        event(new GeofenceEvaluated($check, $input));

        return new GeofenceCheckResultData(
            result: $result,
            mode: $mode,
            checkId: (string) $check->getKey(),
            distanceToFenceM: $distance,
            accuracyM: $input->accuracyM,
            fenceableType: $input->fenceableType,
            fenceableId: $input->fenceableId,
        );
    }

    /**
     * {@inheritDoc}
     */
    public function healthCheck(Geofenceable $fenceable, EvaluateGeofenceData $input): GeofenceCheckResultData
    {
        [$result, $mode, $distance] = $this->run($fenceable, $input);

        return new GeofenceCheckResultData(
            result: $result,
            mode: $mode,
            checkId: null,
            distanceToFenceM: $distance,
            accuracyM: $input->accuracyM,
            fenceableType: $input->fenceableType,
            fenceableId: $input->fenceableId,
        );
    }

    /**
     * Shared decision tree — returns `[result, mode, distanceOrNull]`.
     *
     * @return array{0: GeofenceResult, 1: GeofenceMode, 2: float|null}
     */
    private function run(Geofenceable $fenceable, EvaluateGeofenceData $input): array
    {
        // 1. Accuracy short-circuit.
        $tolerance = $fenceable->geofenceAccuracyToleranceM() ?: $this->defaultAccuracyToleranceM;
        if ($input->accuracyM > $tolerance) {
            return [GeofenceResult::Skipped, GeofenceMode::Polygon, null];
        }

        try {
            // 2. Polygon branch.
            $polygon = $fenceable->geofencePolygon();
            if ($polygon !== null) {
                $vertices = $this->normalisePolygon($polygon);
                $isInside = $this->polygonEvaluator->isPointInPolygon(
                    $input->lat,
                    $input->lng,
                    $vertices,
                );
                $distance = $this->polygonEvaluator->distanceToPolygonM(
                    $input->lat,
                    $input->lng,
                    $vertices,
                );

                return [
                    $isInside ? GeofenceResult::Inside : GeofenceResult::Outside,
                    GeofenceMode::Polygon,
                    $distance,
                ];
            }

            // 3. Radius fallback.
            $point = $fenceable->locationPoint();
            if ($point === null) {
                throw new FenceableNoGeometryException(
                    'Fenceable has neither a polygon nor a location point.',
                );
            }

            $radiusM = $fenceable->geofenceRadiusM() ?? $this->defaultRadiusM;
            [$anchorLat, $anchorLng] = $this->normalisePoint($point);

            $distance = $this->polygonEvaluator->haversineDistanceM(
                $input->lat,
                $input->lng,
                $anchorLat,
                $anchorLng,
            );

            return [
                $distance <= $radiusM ? GeofenceResult::Inside : GeofenceResult::Outside,
                GeofenceMode::Radius,
                $distance,
            ];
        } catch (FenceableNoGeometryException) {
            // Fail-closed — a missing fence is a configuration bug, not a
            // successful evaluation.
            return [GeofenceResult::Error, GeofenceMode::Radius, null];
        } catch (Throwable) {
            // 4. Unexpected fault — fail-closed.
            return [GeofenceResult::Error, GeofenceMode::Radius, null];
        }
    }

    /**
     * Normalise a polygon into an array of `{lat, lng}` vertices. Accepts:
     *
     *   - Arrays of the exact shape.
     *   - Any object with a `toArray()` returning the shape (Magellan
     *     `Polygon` shipping via consumer apps).
     *   - Any object with a `->points` or similar iterable of `{lat, lng}`.
     *
     * @return list<array{lat: float, lng: float}>
     */
    private function normalisePolygon(mixed $polygon): array
    {
        if (\is_array($polygon)) {
            return $this->coerceVertices($polygon);
        }

        if (\is_object($polygon)) {
            if (\method_exists($polygon, 'toArray')) {
                $data = $polygon->toArray();
                if (\is_array($data)) {
                    // Magellan-style Polygon → toArray returns nested rings.
                    // Flatten to the exterior ring.
                    if (isset($data[0]) && \is_array($data[0]) && isset($data[0][0]) && \is_array($data[0][0])) {
                        return $this->coerceVertices($data[0]);
                    }

                    return $this->coerceVertices($data);
                }
            }

            if (isset($polygon->points) && \is_iterable($polygon->points)) {
                return $this->coerceVertices(\iterator_to_array($polygon->points, false));
            }
        }

        return [];
    }

    /**
     * Coerce an array-like structure of vertices into the canonical shape.
     *
     * @param  array<int, mixed>  $raw
     * @return list<array{lat: float, lng: float}>
     */
    private function coerceVertices(array $raw): array
    {
        $vertices = [];
        foreach ($raw as $vertex) {
            if (\is_array($vertex) && isset($vertex['lat'], $vertex['lng'])) {
                $vertices[] = [
                    'lat' => (float) $vertex['lat'],
                    'lng' => (float) $vertex['lng'],
                ];
                continue;
            }

            if (\is_object($vertex)) {
                $lat = $this->readNumeric($vertex, ['lat', 'latitude', 'y']);
                $lng = $this->readNumeric($vertex, ['lng', 'longitude', 'x']);
                if ($lat !== null && $lng !== null) {
                    $vertices[] = ['lat' => $lat, 'lng' => $lng];
                }
            }
        }

        return $vertices;
    }

    /**
     * Normalise a `Point`-like value to `[lat, lng]`.
     *
     * @return array{0: float, 1: float}
     */
    private function normalisePoint(mixed $point): array
    {
        if (\is_array($point) && isset($point['lat'], $point['lng'])) {
            return [(float) $point['lat'], (float) $point['lng']];
        }

        if (\is_object($point)) {
            $lat = $this->readNumeric($point, ['lat', 'latitude', 'y']);
            $lng = $this->readNumeric($point, ['lng', 'longitude', 'x']);
            if ($lat !== null && $lng !== null) {
                return [$lat, $lng];
            }
        }

        return [0.0, 0.0];
    }

    /**
     * Read the first numeric property from a candidate list.
     *
     * @param  list<string>  $keys
     */
    private function readNumeric(object $target, array $keys): ?float
    {
        foreach ($keys as $key) {
            if (isset($target->{$key}) && \is_numeric($target->{$key})) {
                return (float) $target->{$key};
            }

            if (\method_exists($target, $key)) {
                /** @var mixed $value */
                $value = $target->{$key}();
                if (\is_numeric($value)) {
                    return (float) $value;
                }
            }
        }

        return null;
    }
}
