<?php

declare(strict_types=1);

namespace Academorix\Geography\Events;

use Illuminate\Foundation\Events\Dispatchable;

use Academorix\Events\Attributes\AsEvent;
/**
 * Fired when neither MaxMind nor ip-api.com could resolve an IP.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class GeolocationFailed
{
    use Dispatchable;

    /**
     * @param  string       $ip              The IP the caller submitted.
     * @param  string       $reason          Human-readable failure summary.
     * @param  string|null  $exceptionClass  Class of the vendor exception, when applicable.
     */
    public function __construct(
        public string $ip,
        public string $reason,
        public ?string $exceptionClass = null,
    ) {
    }
}
