<?php

declare(strict_types=1);

namespace Academorix\Localization\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched by the `TenantLocale` observer when a tenant enables a
 * platform language for the first time.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.language.enabled_for_tenant')]
final readonly class LanguageEnabledForTenant implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $tenantId    Tenant that enabled the language.
     * @param  string  $languageId  Platform-language id that was enabled.
     * @param  bool    $isDefault   Whether the enablement was flagged default.
     */
    public function __construct(
        public string $tenantId,
        public string $languageId,
        public bool $isDefault,
    ) {
    }
}
