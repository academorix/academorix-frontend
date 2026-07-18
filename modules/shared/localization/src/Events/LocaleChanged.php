<?php

declare(strict_types=1);

namespace Academorix\Localization\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a user's stored `preferred_locale` changes. Fires
 * from the `PersistLocalePreference` middleware AFTER the write
 * commits so consumers never see a rolled-back preference.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.locale.changed')]
final readonly class LocaleChanged implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $userId       User whose preference changed.
     * @param  string  $tenantId     Tenant context in which the change happened.
     * @param  string  $fromLocale   Previous BCP-47 tag.
     * @param  string  $toLocale     New BCP-47 tag.
     */
    public function __construct(
        public string $userId,
        public string $tenantId,
        public string $fromLocale,
        public string $toLocale,
    ) {
    }
}
