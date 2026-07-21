<?php

declare(strict_types=1);

namespace Stackra\Settings\Actions;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Put;
use Stackra\Routing\Concerns\AsController;
use Stackra\Settings\Contracts\SettingsServiceInterface;
use Stackra\Settings\Data\UpdateSettingsRequestData;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * `PUT /api/v1/settings/{group}` — partial update of one
 * settings group at the current scope node.
 *
 * Validates the payload against the group's registered
 * `#[SettingField]` rules via {@see UpdateSettingsRequestData}
 * (Spatie Data resolves the rule set at runtime from the
 * registry). The service merges the incoming values with the
 * currently-resolved values, writes only changed fields through
 * the scope substrate, and dispatches `SettingsChangeEvent` —
 * the shipped listeners persist the audit trail.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsAction(name: 'settings.update')]
#[Put(
    uri: '/api/v1/settings/{group}',
    name: 'settings.update',
    summary: 'Partial update of one settings group.',
    tags: ['Settings'],
    parameters: [
        ['name' => 'group', 'in' => 'path', 'type' => 'string', 'required' => true],
    ],
    responseType: 'object',
    responseCode: 200,
)]
#[Middleware(['api', 'tenant', 'auth:sanctum'])]
final class UpdateSettingsGroup
{
    use AsController;

    /**
     * @param  SettingsServiceInterface  $settings  Settings service.
     */
    public function __construct(
        private readonly SettingsServiceInterface $settings,
    ) {}

    /**
     * Apply the partial update.
     *
     * @param  string  $group  Group key from the URI.
     * @param  UpdateSettingsRequestData  $data  Validated payload.
     * @return array<string, mixed>  The full merged result.
     *
     * @throws NotFoundHttpException When the group is unknown.
     */
    public function __invoke(string $group, UpdateSettingsRequestData $data): array
    {
        try {
            return $this->settings->updateGroup($group, $data->values);
        } catch (InvalidArgumentException $e) {
            throw new NotFoundHttpException($e->getMessage(), $e);
        }
    }
}
