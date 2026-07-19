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
 * `GET /api/v1/settings/schema` — full admin-UI schema for every
 * registered group.
 *
 * Returns groups + sections + fields + control types + validation
 * rules so the frontend can render the settings surface without
 * hard-coding any group-specific knowledge.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsAction(name: 'settings.tenant.schema')]
#[Get('/api/v1/settings/schema')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SettingsPermission::ManageOwn)]
final class ShowSettingsSchema
{
    use AsController;

    public function __construct(
        private readonly SettingsServiceInterface $settings,
        private readonly SettingsRegistryInterface $registry,
    ) {
    }

    /**
     * @return array<string, array<string, mixed>>  Group slug → full schema payload.
     */
    public function __invoke(): array
    {
        $out = [];

        foreach (\array_keys($this->registry->groups()) as $groupKey) {
            /** @var string $groupKey */
            $out[$groupKey] = $this->settings->schema($groupKey);
        }

        return $out;
    }
}
