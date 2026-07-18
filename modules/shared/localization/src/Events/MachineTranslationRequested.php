<?php

declare(strict_types=1);

namespace Academorix\Localization\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched by `TranslateJob` just before the driver call. Present
 * so the driver-status dashboard can track in-flight requests per
 * tenant.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.machine_translation.requested')]
final readonly class MachineTranslationRequested
{
    use Dispatchable;

    /**
     * @param  string  $tenantId      Tenant driving the request.
     * @param  string  $namespace     Namespace bucket.
     * @param  string  $key           Translation key.
     * @param  string  $sourceLocale  BCP-47 tag of the source.
     * @param  string  $targetLocale  BCP-47 tag of the target.
     * @param  string  $driver        Driver identifier.
     */
    public function __construct(
        public string $tenantId,
        public string $namespace,
        public string $key,
        public string $sourceLocale,
        public string $targetLocale,
        public string $driver,
    ) {
    }
}
