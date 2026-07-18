<?php

declare(strict_types=1);

namespace Academorix\Localization\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched by the `ResolveLocale` middleware once per request.
 * Non-queued — telemetry consumers push to the tracing span
 * synchronously.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.locale.resolved')]
final readonly class LocaleResolved
{
    use Dispatchable;

    /**
     * @param  string|null  $tenantId       Resolved tenant id (may be null on unauthenticated routes).
     * @param  string|null  $userId         Authenticated user id, when present.
     * @param  string       $localeCode     BCP-47 tag chosen for the request.
     * @param  string       $source         Strategy name that produced the winner (see LocaleResolutionSource).
     * @param  string|null  $fallbackCode   BCP-47 tag the fallback resolution would use.
     */
    public function __construct(
        public ?string $tenantId,
        public ?string $userId,
        public string $localeCode,
        public string $source,
        public ?string $fallbackCode,
    ) {
    }
}
