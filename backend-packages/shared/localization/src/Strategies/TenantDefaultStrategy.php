<?php

declare(strict_types=1);

namespace Academorix\Localization\Strategies;

use Academorix\Localization\Attributes\AsLocaleResolutionStrategy;
use Academorix\Localization\Contracts\Data\PlatformLanguageInterface;
use Academorix\Localization\Contracts\Repositories\TenantLocaleRepositoryInterface;
use Academorix\Localization\Contracts\Services\LocaleResolutionStrategyInterface;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Http\Request;

/**
 * Resolve the active locale from the tenant's `is_default=true`
 * `TenantLocale` row.
 *
 * Falls through cleanly when no tenant is resolved on the request
 * (unauthenticated marketing pages).
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsLocaleResolutionStrategy(name: 'tenant')]
#[Scoped]
final class TenantDefaultStrategy implements LocaleResolutionStrategyInterface
{
    /**
     * @param  TenantContextInterface           $tenantContext  Resolved tenant.
     * @param  TenantLocaleRepositoryInterface  $tenantLocales  Tenant-locale lookup.
     */
    public function __construct(
        private readonly TenantContextInterface $tenantContext,
        private readonly TenantLocaleRepositoryInterface $tenantLocales,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(Request $request): ?string
    {
        $tenant = $this->tenantContext->current();
        if ($tenant === null) {
            return null;
        }

        $default = $this->tenantLocales->findDefaultForTenant((string) $tenant->getKey());
        if ($default === null) {
            return null;
        }

        // Chain through the platform language to get the BCP-47 tag.
        $language = $default->language;
        if ($language === null) {
            return null;
        }

        $tag = $language->{PlatformLanguageInterface::ATTR_BCP47_CODE};

        return \is_string($tag) && $tag !== '' ? $tag : null;
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'tenant';
    }
}
