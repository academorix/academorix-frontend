<?php

declare(strict_types=1);

namespace Stackra\Tasks\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/tasks/{task}/assignments/{assignment}/decline`.
 *
 * A decline reason is REQUIRED — it lands on
 * `task_assignments.declined_reason` and on the outbound
 * `TaskAssignmentDeclined` event so the reassignment machinery has
 * signal to route around this assignee.
 *
 * @category Tasks
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class DeclineAssignmentRequestData extends Data
{
    /**
     * @param  string  $reason  Free-form reason (max 500 chars).
     */
    public function __construct(
        #[Required, StringType, Max(500)]
        public string $reason,
    ) {
    }
}
