<?php

declare(strict_types=1);

namespace Academorix\Localization\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched by the `TenantLocale` observer when a tenant disables
 * an enabled locale.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.language.disabled_for_tenant')]
final readonly class LanguageDisabledForTenant implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $tenantId    Tenant that disabled the language.
     * @param  string  $languageId  Platform-language id.
     */
    public function __construct(
        public string $tenantId,
        public string $languageId,
    ) {
    }
}
