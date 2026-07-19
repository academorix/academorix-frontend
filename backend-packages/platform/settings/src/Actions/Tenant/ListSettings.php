<?php

declare(strict_types=1);

namespace Academorix\Settings\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Settings\Contracts\Services\SettingsRegistryInterface;
use Academorix\Settings\Contracts\Services\SettingsServiceInterface;
use Academorix\Settings\Enums\SettingsPermission;

/**
 * `GET /api/v1/settings` — every registered group's currently-
 * resolved values for the caller.
 *
 * Reads every group's fields through the resolver cascade so the
 * response reflects the deepest override that applies to the caller.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsAction(name: 'settings.tenant.list')]
#[Get('/api/v1/settings')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SettingsPermission::ManageOwn)]
final class ListSettings
{
    use AsController;

    public function __construct(
        private readonly SettingsServiceInterface $settings,
        private readonly SettingsRegistryInterface $registry,
    ) {
    }

    /**
     * @return array<string, array<string, mixed>>  Group slug → resolved values.
     */
    public function __invoke(): array
    {
        $out = [];

        foreach (\array_keys($this->registry->groups()) as $groupKey) {
            /** @var string $groupKey */
            $out[$groupKey] = $this->settings->all($groupKey);
        }

        return $out;
    }
}
