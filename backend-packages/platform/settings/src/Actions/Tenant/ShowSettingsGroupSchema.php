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
 * `GET /api/v1/settings/{group}/schema` — the admin-UI schema for
 * exactly one group.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsAction(name: 'settings.tenant.group_schema')]
#[Get('/api/v1/settings/{group}/schema')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SettingsPermission::ManageOwn)]
final class ShowSettingsGroupSchema
{
    use AsController;

    public function __construct(
        private readonly SettingsServiceInterface $settings,
    ) {
    }

    /**
     * @param  string  $group  Group slug (URL segment).
     * @return array<string, mixed>  Schema payload for the group.
     */
    public function __invoke(string $group): array
    {
        return $this->settings->schema($group);
    }
}
