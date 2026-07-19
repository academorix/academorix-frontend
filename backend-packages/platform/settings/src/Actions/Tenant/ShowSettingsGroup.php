<?php

declare(strict_types=1);

namespace Academorix\Settings\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Settings\Contracts\Services\SettingsServiceInterface;
use Academorix\Settings\Enums\SettingsPermission;

/**
 * `GET /api/v1/settings/{group}` — resolved values for one group.
 *
 * Sensitive fields are masked in the output. Callers that carry
 * `settings.view-sensitive` may pass `?reveal=true` to unmask —
 * every such call writes an audit row.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsAction(name: 'settings.tenant.show')]
#[Get('/api/v1/settings/{group}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SettingsPermission::ManageOwn)]
final class ShowSettingsGroup
{
    use AsController;

    public function __construct(
        private readonly SettingsServiceInterface $settings,
    ) {
    }

    /**
     * @param  string  $group  Group slug (URL segment).
     * @return array<string, mixed>  Field key → resolved value.
     */
    public function __invoke(string $group): array
    {
        return $this->settings->all($group);
    }
}
