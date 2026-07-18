<?php

declare(strict_types=1);

namespace Academorix\Settings\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Put;
use Academorix\Routing\Concerns\AsController;
use Academorix\Settings\Contracts\Services\SettingsServiceInterface;
use Academorix\Settings\Data\Requests\UpdateSettingsGroupRequestData;
use Academorix\Settings\Enums\SettingsPermission;

/**
 * `PUT /api/v1/settings/{group}` — bulk update of a group's fields.
 *
 * Every changed field fires a
 * {@see \Academorix\Settings\Events\SettingsChangeEvent} on commit;
 * fields absent from the payload are untouched (partial update).
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsAction(name: 'settings.tenant.update')]
#[Put('/api/v1/settings/{group}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SettingsPermission::ManageOwn)]
final class UpdateSettingsGroup
{
    use AsController;

    public function __construct(
        private readonly SettingsServiceInterface $settings,
    ) {
    }

    /**
     * @param  string                          $group  Group slug (URL segment).
     * @param  UpdateSettingsGroupRequestData  $data   Validated payload.
     * @return array<string, mixed>  Resolved values after the write.
     */
    public function __invoke(string $group, UpdateSettingsGroupRequestData $data): array
    {
        foreach ($data->values as $key => $value) {
            $this->settings->set((string) $key, $value);
        }

        return $this->settings->all($group);
    }
}
