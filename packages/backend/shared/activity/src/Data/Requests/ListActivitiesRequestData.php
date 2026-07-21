<?php

declare(strict_types=1);

namespace Stackra\Activity\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Date;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated query payload for `GET /api/v1/activities` (and the
 * platform-audience mirror). Every filter is optional — the raw
 * endpoint returns the full tenant feed newest-first.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ListActivitiesRequestData extends Data
{
    /**
     * @param  string|null  $logName      Filter by exact log_name (e.g. `branch`).
     * @param  string|null  $subjectType  Filter by polymorphic subject class.
     * @param  string|null  $causerId     Filter by causer id (paired with the caller's guard type).
     * @param  string|null  $from         Lower time bound (ISO-8601, inclusive).
     * @param  string|null  $to           Upper time bound (ISO-8601, exclusive).
     */
    public function __construct(
        #[StringType, Max(64)]
        public ?string $logName = null,

        #[StringType, Max(191)]
        public ?string $subjectType = null,

        #[StringType, Max(64)]
        public ?string $causerId = null,

        #[StringType, Date]
        public ?string $from = null,

        #[StringType, Date]
        public ?string $to = null,
    ) {
    }
}
