<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Console;

use Stackra\Console\Commands\BaseCommand;
use Academorix\Geofencing\Contracts\Geofenceable;
use Academorix\Geofencing\Contracts\Services\GeofenceServiceInterface;
use Academorix\Geofencing\Data\EvaluateGeofenceData;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Stackra\Console\Attributes\AsCommand;

/**
 * `geofencing:test-eval` — smoke-test one evaluation.
 *
 * `--dry-run` calls `healthCheck()` (no persistence). Without it, calls
 * `evaluate()` which persists a real row + fires the event.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'geofencing:test-eval',
    description: 'Smoke-test one geofence evaluation.',
)]
final class TestEvalCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'geofencing:test-eval {fenceable_type} {fenceable_id} {lat} {lng} {accuracy_m=25} {--subject-type=test} {--subject-id=test} {--dry-run}';

    public function handle(GeofenceServiceInterface $service): int
    {
        $fenceableType = (string) $this->argument('fenceable_type');
        $fenceableId   = (string) $this->argument('fenceable_id');
        $lat           = (float) $this->argument('lat');
        $lng           = (float) $this->argument('lng');
        $accuracyM     = (int) $this->argument('accuracy_m');

        $data = new EvaluateGeofenceData(
            fenceableType: $fenceableType,
            fenceableId: $fenceableId,
            lat: $lat,
            lng: $lng,
            accuracyM: $accuracyM,
            subjectType: (string) $this->option('subject-type'),
            subjectId: (string) $this->option('subject-id'),
        );

        // Resolve the fenceable via the morph map.
        $morphMap = Relation::morphMap();
        $className = $morphMap[$fenceableType] ?? null;
        if ($className === null || ! \class_exists($className)) {
            $this->omni->error("Unknown fenceable_type alias: {$fenceableType}");

            return self::FAILURE;
        }

        /** @var Model $modelInstance */
        $modelInstance = new $className();
        $row = $modelInstance->newQuery()->find($fenceableId);
        if (! $row instanceof Geofenceable) {
            $this->omni->error("Fenceable {$fenceableType}:{$fenceableId} not found or not Geofenceable.");

            return self::FAILURE;
        }

        $result = $this->option('dry-run')
            ? $service->healthCheck($row, $data)
            : $service->evaluate($row, $data);

        $this->omni->success(\sprintf(
            'result=%s mode=%s distance=%s accuracy=%d checkId=%s',
            $result->result->value,
            $result->mode->value,
            $result->distanceToFenceM ?? 'n/a',
            $result->accuracyM,
            $result->checkId ?? 'n/a',
        ));

        return self::SUCCESS;
    }
}
