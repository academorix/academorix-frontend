<?php

declare(strict_types=1);

namespace Academorix\Localization\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a tenant admin edits a translation into a
 * human-verified row. Consumers include the activity feed writer +
 * the "translation review complete" notification.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.translation.overridden')]
final readonly class TranslationOverridden implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $tenantId      Tenant that owns the override.
     * @param  string  $translationId Row id that was overridden.
     * @param  string  $actorId       The reviewer's user id.
     * @param  string  $namespace     Namespace bucket.
     * @param  string  $key           Translation key.
     * @param  string  $localeCode    BCP-47 tag.
     */
    public function __construct(
        public string $tenantId,
        public string $translationId,
        public string $actorId,
        public string $namespace,
        public string $key,
        public string $localeCode,
    ) {
    }
}
