<?php

declare(strict_types=1);

namespace Academorix\Localization\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched after `TranslateJob` upserts the translated row. Fires
 * after commit so consumers never observe a rolled-back translation.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.machine_translation.completed')]
final readonly class MachineTranslationCompleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string       $tenantId       Tenant driving the request.
     * @param  string       $translationId  The Translation row id that was upserted.
     * @param  string       $namespace      Namespace bucket.
     * @param  string       $key            Translation key.
     * @param  string       $localeCode     BCP-47 target tag.
     * @param  string       $driver         Driver identifier.
     * @param  float|null   $qualityScore   Driver-reported quality (0.0-1.0).
     * @param  int          $durationMs    Wall-clock duration of the driver call.
     */
    public function __construct(
        public string $tenantId,
        public string $translationId,
        public string $namespace,
        public string $key,
        public string $localeCode,
        public string $driver,
        public ?float $qualityScore,
        public int $durationMs,
    ) {
    }
}
