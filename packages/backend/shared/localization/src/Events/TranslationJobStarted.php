<?php

declare(strict_types=1);

namespace Stackra\Localization\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a bulk translation job transitions from
 * `queued → running`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.translation_job.started')]
final readonly class TranslationJobStarted
{
    use Dispatchable;

    /**
     * @param  string  $jobId         Job row id.
     * @param  string  $tenantId      Tenant driving the job.
     * @param  string  $kind          Job kind (see TranslationJobKind).
     * @param  string  $targetLocale  BCP-47 target tag.
     * @param  string  $driver        Driver identifier.
     */
    public function __construct(
        public string $jobId,
        public string $tenantId,
        public string $kind,
        public string $targetLocale,
        public string $driver,
    ) {
    }
}
