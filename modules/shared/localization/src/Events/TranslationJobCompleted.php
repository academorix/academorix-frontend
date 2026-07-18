<?php

declare(strict_types=1);

namespace Academorix\Localization\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a bulk translation job transitions to
 * `completed`. Fires after commit so the notification consumer
 * doesn't email a user before the counters land in the DB.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.translation_job.completed')]
final readonly class TranslationJobCompleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $jobId            Job row id.
     * @param  string  $tenantId         Tenant that owned the job.
     * @param  int     $keysTranslated   Successful child counts.
     * @param  int     $keysFailed       Failed child counts.
     */
    public function __construct(
        public string $jobId,
        public string $tenantId,
        public int $keysTranslated,
        public int $keysFailed,
    ) {
    }
}
