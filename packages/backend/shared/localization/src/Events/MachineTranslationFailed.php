<?php

declare(strict_types=1);

namespace Stackra\Localization\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when `TranslateJob` exhausted its retry chain.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.machine_translation.failed')]
final readonly class MachineTranslationFailed
{
    use Dispatchable;

    /**
     * @param  string  $tenantId       Tenant driving the request.
     * @param  string  $namespace      Namespace bucket.
     * @param  string  $key            Translation key.
     * @param  string  $localeCode     BCP-47 target tag.
     * @param  string  $driver         Driver identifier.
     * @param  string  $errorClass     FQCN of the raised exception.
     * @param  string  $errorMessage   Human-readable failure summary.
     */
    public function __construct(
        public string $tenantId,
        public string $namespace,
        public string $key,
        public string $localeCode,
        public string $driver,
        public string $errorClass,
        public string $errorMessage,
    ) {
    }
}
