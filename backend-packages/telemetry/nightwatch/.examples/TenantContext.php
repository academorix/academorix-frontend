<?php

declare(strict_types=1);

namespace App\Nightwatch\Contexts;

use Academorix\Nightwatch\Attributes\AsNightwatchContext;
use Academorix\Nightwatch\Contracts\NightwatchContext;

/**
 * Example: Tenant Context.
 *
 * Adds multi-tenant context to Nightwatch for debugging
 * tenant-specific issues.
 */
#[AsNightwatchContext(description: 'Adds tenant context for multi-tenant apps')]
class TenantContext implements NightwatchContext
{
    public function key(): string
    {
        return 'tenant';
    }

    public function data(): array
    {
        $tenant = tenant();

        if (! $tenant) {
            return [];
        }

        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'plan' => $tenant->subscription_plan,
            'region' => $tenant->region,
        ];
    }

    public function priority(): int
    {
        return 100;
    }
}
